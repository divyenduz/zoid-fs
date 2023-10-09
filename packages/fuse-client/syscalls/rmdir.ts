import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";
import { match } from "ts-pattern";
export const rmdir: (backend: SQLiteBackend) => MountOptions["rmdir"] = (
  backend
) => {
  return async (path, cb) => {
    console.log("rmdir(%s)", path);
    const filenameWithoutSlash = path.slice(1);
    const r = await backend.deleteFile(filenameWithoutSlash);
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
