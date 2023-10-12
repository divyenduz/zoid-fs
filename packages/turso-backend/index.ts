import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { SQLiteBackend, PrismaClient } from "@zoid-fs/sqlite-backend";

export class TursoBackend extends SQLiteBackend {
  constructor() {
    const libsql = createClient({
      // @ts-expect-error
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSQL(libsql);
    const prisma = new PrismaClient({
      adapter,
    });
    super(prisma);
  }
}
