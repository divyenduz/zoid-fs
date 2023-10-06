import { PrismaClient } from "@prisma/client";
import { match } from "ts-pattern";

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

  async getFiles() {
    const files = await this.prisma.file.findMany();
    return files;
  }

  async getFile(filename: string) {
    try {
      const file = await this.prisma.file.findFirstOrThrow({
        where: {
          name: filename,
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

  async createFile(filename: string, type = "file") {
    try {
      const file = await this.prisma.file.create({
        data: {
          name: filename,
          type,
          path: "/",
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

  async writeFile(filename: string, content: Buffer) {
    try {
      const file = await this.prisma.file.upsert({
        where: {
          name: filename,
        },
        update: {
          content,
        },
        create: {
          name: filename,
          type: "file",
          path: "/",
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

  async deleteFile(filename: string) {
    try {
      const file = await this.prisma.file.delete({
        where: {
          name: filename,
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

  async renameFile(srcFilename: string, destFilename: string) {
    try {
      const file = await this.prisma.file.update({
        where: {
          name: srcFilename,
        },
        data: {
          name: destFilename,
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
