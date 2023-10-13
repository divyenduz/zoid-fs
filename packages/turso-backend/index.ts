import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient, Client } from "@libsql/client";
import { SQLiteBackend, PrismaClient } from "@zoid-fs/sqlite-backend";

export class TursoBackend extends SQLiteBackend {
  private libsql: Client;
  constructor() {
    const libsql = createClient({
      url: "file:replica.db",
      syncUrl: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    const prisma = new PrismaClient({
      adapter,
    });
    super(prisma);
    this.libsql = libsql;
  }

  async sync() {
    await this.libsql.sync();
  }
}
