import { PrismaClient } from "@prisma/client";
import { match } from "ts-pattern";
import path from "path";

export class SQLiteBackend {
  private prisma: PrismaClient;
  constructor(dbUrl?: string) {
    this.prisma = match(Boolean(dbUrl))
      .with(
        true,
        () =>
          new PrismaClient({
            datasourceUrl: dbUrl,
          })
      )
      .otherwise(() => new PrismaClient());

    this.prisma.$connect();
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
      return {
        status: "not_found" as const,
      };
    }
  }

  async createFile(filepath: string, type = "file") {
    try {
      const parsedPath = path.parse(filepath);
      const file = await this.prisma.file.create({
        data: {
          name: parsedPath.base,
          dir: parsedPath.dir,
          path: filepath,
          type,
          content: Buffer.from([]),
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

  async writeFile(filepath: string, content: Buffer) {
    try {
      const parsedPath = path.parse(filepath);
      const file = await this.prisma.file.upsert({
        where: {
          path: filepath,
        },
        update: {
          content,
        },
        create: {
          name: parsedPath.base,
          dir: parsedPath.dir,
          path: filepath,
          type: "file",
          content,
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
}
