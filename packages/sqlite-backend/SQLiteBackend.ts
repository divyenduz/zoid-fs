import { Content, PrismaClient } from "@prisma/client";
import { Backend } from "@zoid-fs/common";
import { match } from "ts-pattern";
import path from "path";
import { constants } from "fs";
import { rawCreateMany } from "./prismaRawUtil";
import { WriteBuffer } from "./WriteBuffer";

export type ContentChunk = {
  content: Buffer;
  offset: number;
  size: number;
};

const WRITE_BUFFER_SIZE = 1000;

export class SQLiteBackend implements Backend {
  private readonly writeBuffers: Map<string, WriteBuffer<ContentChunk>> =
    new Map();
  private readonly prisma: PrismaClient;
  constructor(prismaOrDbUrl?: PrismaClient | string) {
    if (prismaOrDbUrl instanceof PrismaClient) {
      this.prisma = prismaOrDbUrl;
    } else {
      this.prisma = match(Boolean(prismaOrDbUrl))
        .with(
          true,
          () =>
            new PrismaClient({
              datasourceUrl: prismaOrDbUrl,
            })
        )
        .otherwise(() => new PrismaClient());

      this.prisma.$connect();
    }
  }

  async write(filepath: string, chunk: ContentChunk) {
    const writeBuffer = match(this.writeBuffers.has(filepath))
      .with(true, () => this.writeBuffers.get(filepath))
      .with(false, () => {
        this.writeBuffers.set(
          filepath,
          new WriteBuffer(WRITE_BUFFER_SIZE, async (bufferSlice) => {
            await this.writeFileChunks(filepath, bufferSlice);
          })
        );
        return this.writeBuffers.get(filepath);
      })
      .exhaustive();
    await writeBuffer!.write(chunk);
  }

  async flush(filepath: string) {
    const writeBuffer = this.writeBuffers.get(filepath);
    await writeBuffer?.flush();
  }

  async getLinks(dir: string) {
    const files = await this.prisma.link.findMany({
      where: {
        AND: [
          {
            dir,
          },
          {
            path: {
              not: "/",
            },
          },
        ],
      },
    });
    return files;
  }

  async getLink(filepath: string) {
    try {
      const link = await this.prisma.link.findFirstOrThrow({
        where: {
          path: filepath,
        },
      });

      return {
        status: "ok" as const,
        link,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  async getFile(filepath: string) {
    try {
      const link = await this.prisma.link.findFirstOrThrow({
        where: {
          path: filepath,
        },
      });

      const file = await this.prisma.file.findFirstOrThrow({
        where: {
          id: link.fileId,
        },
      });
      return {
        status: "ok" as const,
        file,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  async getFileChunks(fileId: number, offset: number, size: number) {
    try {
      const chunks = await this.prisma.content.findMany({
        where: {
          fileId,
          AND: [
            {
              offset: {
                gte: offset,
              },
            },
            {
              offset: {
                lt: offset + size,
              },
            },
          ],
        },
        orderBy: {
          offset: "asc",
        },
      });

      return {
        status: "ok" as const,
        chunks,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  async getFileSize(filepath: string) {
    try {
      const file = await this.getFile(filepath);
      // TODO: error handling
      const chunks = await this.prisma.content.findMany({
        where: {
          fileId: file.file?.id,
        },
      });
      const bufChunk = Buffer.concat(chunks.map((chunk) => chunk.content));
      return {
        status: "ok" as const,
        size: Buffer.byteLength(bufChunk),
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  async getFileNLinks(filepath: string) {
    try {
      const file = await this.getFile(filepath);

      // TODO: error handling
      const nLinks = await this.prisma.link.findMany({
        where: {
          fileId: file.file?.id,
        },
      });
      return {
        status: "ok" as const,
        nLinks,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  async createLink(filepath: string, destinationPath: string) {
    try {
      // Note: destination is new link, filepath is the existing file
      const file = await this.getFile(filepath);
      const parsedPath = path.parse(destinationPath);

      const link = await this.prisma.link.create({
        data: {
          name: parsedPath.base,
          dir: parsedPath.dir,
          path: destinationPath,
          type: "file", // Note: hard link is a regular file
          fileId: file.file!.id,
        },
      });

      return {
        status: "ok" as const,
        file: link,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  async createFile(
    filepath: string,
    type = "file",
    mode = 16877, // dir (for default to be file, use 33188)
    uid: number,
    gid: number,
    targetPath: string = ""
  ) {
    try {
      const parsedPath = path.parse(filepath);

      const { file, link } = await this.prisma.$transaction(async (tx) => {
        const file = await tx.file.create({
          data: {
            mode: type === "dir" ? 16877 : mode,
            atime: new Date(),
            mtime: new Date(),
            ctime: new Date(),
            uid,
            gid,
          },
        });

        const link = await tx.link.create({
          data: {
            name: parsedPath.base,
            type,
            dir: parsedPath.dir,
            path: filepath,
            targetPath,
            fileId: file.id,
          },
        });

        return { file, link };
      });

      return {
        status: "ok" as const,
        file: file,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  private async writeFileChunks(filepath: string, chunks: ContentChunk[]) {
    if (chunks.length === 0) {
      return {
        status: "ok" as const,
        chunks,
      };
    }

    try {
      const rFile = await this.getFile(filepath);
      const file = rFile.file;

      /**
       *
       * Simulate "upsert" by deleting anything within a block range for a file before bulk inserting!
       * TODO: this should happen in a transaction
       */

      for await (const chunk of chunks) {
        await this.prisma.content.deleteMany({
          where: {
            offset: chunk.offset,
            size: chunk.size,
            fileId: file?.id,
          },
        });
      }

      await rawCreateMany<Omit<Content, "id">>(
        this.prisma,
        "Content",
        ["content", "offset", "size", "fileId"],
        chunks.map((chunk) => {
          const { content, offset, size } = chunk;
          return {
            content,
            offset,
            size,
            fileId: file?.id,
          };
        })
      );

      return {
        status: "ok" as const,
        chunks,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  async truncateFile(filepath: string, size: number) {
    try {
      const link = await this.prisma.link.findFirstOrThrow({
        where: {
          path: filepath,
        },
      });
      const file = await this.prisma.content.deleteMany({
        where: {
          fileId: link.fileId,
          offset: {
            gte: size,
          },
        },
      });
      return {
        status: "ok" as const,
        file: file,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  async deleteFile(filepath: string) {
    try {
      const link = await this.prisma.link.findFirstOrThrow({
        where: {
          path: filepath,
        },
      });
      const file = await this.prisma.file.deleteMany({
        where: {
          id: link.fileId,
        },
      });

      return {
        status: "ok" as const,
        count: file.count,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  async renameFile(srcPath: string, destPath: string) {
    try {
      const parsedSrcPath = path.parse(srcPath);
      const parsedDestPath = path.parse(destPath);

      const { updatedLink: link } = await this.prisma.$transaction(
        async (tx) => {
          // Note: Delete if the destiantion path already exists
          const link = await tx.link.findFirstOrThrow({
            where: {
              path: destPath,
            },
          });

          // Note: deleting file should delete link and content as cascade delete is enabled
          const fileDeleteMany = await tx.file.deleteMany({
            where: {
              id: link.id,
            },
          });

          const updatedLink = await tx.link.update({
            where: {
              name: parsedSrcPath.base,
              dir: parsedSrcPath.dir,
              path: srcPath,
            },
            data: {
              name: parsedDestPath.base,
              dir: parsedDestPath.dir,
              path: destPath,
            },
          });

          return { updatedLink };
        }
      );

      return {
        status: "ok" as const,
        link,
      };
    } catch (e) {
      console.error(e);
      return {
        // TODO: not_found is not the truth, it can fail for other reasons
        status: "not_found" as const,
      };
    }
  }

  async updateMode(filepath: string, mode: number) {
    try {
      const { file, link } = await this.prisma.$transaction(async (tx) => {
        const link = await tx.link.findFirstOrThrow({
          where: {
            path: filepath,
          },
        });
        const file = await tx.file.update({
          where: {
            id: link.id,
          },
          data: {
            mode,
          },
        });
        return { file, link };
      });

      return {
        status: "ok" as const,
        file: file,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }

  async updateTimes(filepath: string, atime: number, mtime: number) {
    try {
      const { file, link } = await this.prisma.$transaction(async (tx) => {
        const link = await tx.link.findFirstOrThrow({
          where: {
            path: filepath,
          },
        });
        const file = await tx.file.update({
          where: {
            id: link.fileId,
          },
          data: {
            atime: new Date(atime),
            mtime: new Date(mtime),
          },
        });
        return { file, link };
      });

      return {
        status: "ok" as const,
        file: file,
      };
    } catch (e) {
      console.error(e);
      return {
        status: "not_found" as const,
      };
    }
  }
}
