import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const truncate: (backend: SQLiteBackend) => MountOptions["truncate"] = (
  backend
) => {
  return async (path, size, cb) => {
    console.info("truncate(%s, %d)", path, size);
    const r = await backend.truncateFile(path, size);
    await match(r)
      .with({ status: "ok" }, async (r) => {
        cb(0);
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
