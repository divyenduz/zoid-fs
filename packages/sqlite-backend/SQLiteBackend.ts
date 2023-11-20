import { Content, PrismaClient } from "@prisma/client";
import { Backend } from "@zoid-fs/common";
import { match } from "ts-pattern";
import path from "path";
import { rawCreateMany } from "./prismaRawUtil";
import { WriteBuffer } from "./WriteBuffer";
import mmmagic, { Magic } from "mmmagic";
import { promisify } from "util";
import { VirtualFiles } from "./VirtualFiles";
import { VirtualFile } from "./VirtualFile";

export type ContentChunk = {
  content: Buffer;
  offset: number;
  size: number;
};

const WRITE_BUFFER_SIZE = 10000;

export class SQLiteBackend implements Backend {
  private readonly writeBuffers: Map<string, WriteBuffer<ContentChunk>> =
    new Map();
  private readonly prisma: PrismaClient;
  private readonly virtualFiles: VirtualFiles;
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

    const virtualFile = new VirtualFile(
      999,
      "/.zoid-meta",
      JSON.stringify(
        {
          databaseUrl: process.env.DATABASE_URL,
        },
        null,
        2
      ) + "\n"
    );
    const virtualFileMap = new Map();
    virtualFileMap.set(virtualFile.path, virtualFile);
    this.virtualFiles = new VirtualFiles(virtualFileMap);
  }

  isVirtualFile(filepath: string) {
    return this.virtualFiles.isVirtualFile(filepath);
  }

  getVirtualFile(filepath: string) {
    return this.virtualFiles.getVirtualFile(filepath)!;
  }

  getVirtualFilePaths(filepath: string) {
    return this.virtualFiles.filePaths(filepath);
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

    // TODO: move to event based system
    if (chunk.offset === 0) {
      const magic = new Magic(mmmagic.MAGIC_MIME_TYPE);
      const magicAsync = promisify(magic.detect.bind(magic));
      const fileType = (await magicAsync(chunk.content)) as string;
      const link = await this.prisma.link.findUnique({
        where: {
          path: filepath,
        },
      });
      const r = await this.prisma.$executeRaw`
        INSERT OR REPLACE INTO MetaData (fileId, status, fileType)
        VALUES (${link?.fileId}, "PENDING", ${fileType})
      `;
    }

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
      const lastChunkR = await this.prisma.content.findMany({
        where: {
          fileId: file.file?.id,
        },
        orderBy: {
          offset: "desc",
        },
        take: 1,
      });
      if (lastChunkR.length === 0) {
        return {
          status: "ok" as const,
          size: 0,
        };
      }
      const { offset, size } = lastChunkR[0];
      return {
        status: "ok" as const,
        size: offset + size,
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

      const firstChunk = chunks[0];
      const lastChunk = chunks[chunks.length - 1];
      await this.prisma.$executeRaw`DELETE FROM content WHERE offset >= ${
        firstChunk.offset
      } AND offset <= ${lastChunk.offset + 1} AND fileId = ${file?.id}`;

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

      // TODO: probably do this in an event system!
      await this.prisma.$executeRaw`
        UPDATE MetaData
        SET status = "PENDING"
        WHERE fileId = ${file?.id}
      `;

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
      await this.prisma.$transaction(async (tx) => {
        const link = await this.prisma.link.findFirstOrThrow({
          where: {
            path: filepath,
          },
        });
        await this.prisma.link.deleteMany({
          where: {
            id: link.id,
          },
        });
        const file = await this.prisma.file.deleteMany({
          where: {
            id: link.fileId,
          },
        });
        const content = await this.prisma.content.deleteMany({
          where: {
            fileId: link.fileId,
          },
        });
        return { link };
      });

      return {
        status: "ok" as const,
        count: 1,
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
          try {
            // Note: Delete if the destiantion path already exists
            const link = await tx.link.findFirstOrThrow({
              where: {
                path: destPath,
              },
            });

            // Note: deleting file should delete link and content as cascade delete is enabled
            const fileDeleteMany = await tx.file.deleteMany({
              where: {
                id: link.fileId,
              },
            });
          } catch (e) {
            // TODO: we should now consume errors without print / rethrowing them
          }

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
            id: link.fileId,
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

  async close() {
    await this.prisma.$disconnect();
  }
}
