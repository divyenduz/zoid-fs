import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";
import fuse from "@zoid-fs/node-fuse-bindings";

export const chmod: (backend: SQLiteBackend) => MountOptions["chmod"] = (
  backend
) => {
  return async (path, mode, cb) => {
    console.info("chmod(%s, %d)", path, mode);

    if (backend.isVirtualFile(path)) {
      cb(0);
      return;
    }

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
