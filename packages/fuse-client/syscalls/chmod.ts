import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";
import { match } from "ts-pattern";
import fuse from "node-fuse-bindings";

export const chmod: (backend: SQLiteBackend) => MountOptions["chmod"] = (
  backend
) => {
  return async (path, mode, cb) => {
    console.log("chmod(%s, %d)", path, mode);
    const r = await backend.updateMode(path, mode);
    match(r)
      .with({ status: "ok" }, () => {
        cb(0);
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
