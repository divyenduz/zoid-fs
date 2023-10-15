import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import path from "path";

export const rename: (backend: SQLiteBackend) => MountOptions["rename"] = (
  backend
) => {
  return async (srcPath, destPath, cb) => {
    console.log("rename(%s, %s)", srcPath, destPath);
    const r = await backend.renameFile(srcPath, destPath);
    if (r.status === "ok") {
      console.log("rename(%s, %s) success", srcPath, destPath);
      cb(0);
    } else {
      // TODO: can move fail, if yes, when?
      // For example when dest doesn't exist??
      cb(fuse.ENOENT);
    }
  };
};
