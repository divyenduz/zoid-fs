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

const WRITE_BUFFER_SIZE = 10;

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
        dir,
      },
    });
    return files;
  }

  async getFile(filepath: string) {
    try {
      const fileOrSymlink = await this.prisma.file.findFirstOrThrow({
        where: {
          path: filepath,
        },
      });

      const file = await match(fileOrSymlink.type === "symlink")
        .with(true, async () => {
          const targetFile = await this.prisma.file.findFirstOrThrow({
            where: {
              id: fileOrSymlink.targetId,
            },
          });
          return {
            ...targetFile,
            mode: constants.S_IFLNK,
          };
        })
        .otherwise(() => fileOrSymlink);

      return {
        status: "ok" as const,
        file: file,
      };
    } catch (e) {
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
      return {
        status: "not_found" as const,
      };
    }
  }

  async getFileSize(filepath: string) {
    try {
      const chunks = await this.prisma.content.findMany({
        where: {
          file: {
            path: filepath,
          },
        },
      });
      const bufChunk = Buffer.concat(chunks.map((chunk) => chunk.content));
      return {
        status: "ok" as const,
        size: Buffer.byteLength(bufChunk),
      };
    } catch (e) {
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
    targetId: number = 0
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
          targetId,
        },
      });
      return {
        status: "ok" as const,
        file: file,
      };
    } catch (e) {
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
      return {
        status: "not_found" as const,
      };
    }
  }

  async deleteFile(filepath: string) {
    try {
      const file = await this.prisma.file.delete({
        where: {
          path: filepath,
        },
      });

      return {
        status: "ok" as const,
        file: file,
      };
    } catch (e) {
      return {
        status: "not_found" as const,
      };
    }
  }

  async renameFile(srcPath: string, destPath: string) {
    try {
      const parsedSrcPath = path.parse(srcPath);
      const parsedDestPath = path.parse(destPath);
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
      return {
        status: "not_found" as const,
      };
    }
  }
}
