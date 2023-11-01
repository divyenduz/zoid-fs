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

  async getFiles(dir: string) {
    const files = await this.prisma.file.findMany({
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

  async getFileRaw(filepath: string) {
    try {
      const file = await this.prisma.file.findFirstOrThrow({
        where: {
          path: filepath,
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

  async getFileResolved(filepath: string) {
    try {
      const fileOrSymlink = await this.getFileRaw(filepath);
      if (fileOrSymlink.status === "not_found") {
        return {
          status: "not_found" as const,
        };
      }

      const file = await match(fileOrSymlink.file.type)
        .with("symlink", async () => {
          const targetFile = await this.getFileRaw(
            fileOrSymlink.file.targetPath
          );
          return {
            // TODO: error handling
            ...targetFile.file!,
            mode: constants.S_IFLNK,
          };
        })
        .with("link", async () => {
          const targetFile = await this.getFileRaw(
            fileOrSymlink.file.targetPath
          );
          return {
            // TODO: error handling
            ...targetFile.file!,
          };
        })
        .otherwise(() => fileOrSymlink.file);

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
      const file = await this.getFileResolved(filepath);
      // TODO: error handling
      const chunks = await this.prisma.content.findMany({
        where: {
          file: {
            path: file.file?.path,
          },
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
      const file = await this.getFileResolved(filepath);

      // TODO: error handling
      const nLinks = await this.prisma.file.findMany({
        where: {
          OR: [
            {
              path: file.file?.path,
            },
            {
              targetPath: file.file?.path,
            },
          ],
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
      const file = await this.prisma.file.create({
        data: {
          name: parsedPath.base,
          dir: parsedPath.dir,
          path: filepath,
          type,
          mode: type === "dir" ? 16877 : mode,
          atime: new Date(),
          mtime: new Date(),
          ctime: new Date(),
          uid,
          gid,
          targetPath,
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

  async writeFile(filepath: string, uid: number, gid: number) {
    try {
      const parsedPath = path.parse(filepath);
      const file = await this.prisma.file.upsert({
        where: {
          path: filepath,
        },
        update: {},
        create: {
          type: "file",
          name: parsedPath.base,
          dir: parsedPath.dir,
          path: filepath,
          mode: 755,
          atime: new Date(),
          mtime: new Date(),
          ctime: new Date(),
          uid,
          gid,
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

  private async writeFileChunks(filepath: string, chunks: ContentChunk[]) {
    if (chunks.length === 0) {
      return {
        status: "ok" as const,
        chunks,
      };
    }

    try {
      const rFile = await this.getFileResolved(filepath);
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
      const file = await this.prisma.content.deleteMany({
        where: {
          file: {
            path: filepath,
          },
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
      const file = await this.prisma.file.deleteMany({
        where: {
          OR: [
            {
              path: filepath,
            },
            { AND: [{ type: "link", targetPath: filepath }] },
          ],
        },
      });

      return {
        status: "ok" as const,
        file: file.count,
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

      // Note: Delete if the destiantion path already exists
      await this.prisma.file.deleteMany({
        where: {
          path: destPath,
        },
      });

      const file = await this.prisma.file.update({
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
      return {
        status: "ok" as const,
        file: file,
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
      const file = await this.prisma.file.update({
        where: {
          path: filepath,
        },
        data: {
          mode,
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

  async updateTimes(filepath: string, atime: number, mtime: number) {
    try {
      const file = await this.prisma.file.update({
        where: {
          path: filepath,
        },
        data: {
          atime: new Date(atime),
          mtime: new Date(mtime),
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
}
