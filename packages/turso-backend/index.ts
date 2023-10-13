import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient, Client } from "@libsql/client";
import { SQLiteBackend, PrismaClient } from "@zoid-fs/sqlite-backend";
import { match } from "ts-pattern";

export class TursoBackend extends SQLiteBackend {
  private libsql: Client;
  constructor(embedded: boolean) {
    const libsql = match(embedded)
      .with(true, () => {
        return createClient({
          url: "file:replica.db",
          syncUrl: process.env.TURSO_DATABASE_SYNC_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        });
      })
      .with(false, () => {
        return createClient({
          // @ts-expect-error
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        });
      })
      .exhaustive();

    const adapter = new PrismaLibSQL(libsql);
    const prisma = new PrismaClient({
      adapter,
    });
    super(prisma);
    this.libsql = libsql;
  }

  async sync() {
    await this.libsql.sync();
    setInterval(() => {
      this.libsql.sync();
    }, 1000);
  }
}
