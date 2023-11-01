import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";
export const rmdir: (backend: SQLiteBackend) => MountOptions["rmdir"] = (
  backend
) => {
  return async (path, cb) => {
    console.info("rmdir(%s)", path);
    const r = await backend.deleteFile(path);
    match(r)
      .with({ status: "ok" }, (r) => {
        cb(0);
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
