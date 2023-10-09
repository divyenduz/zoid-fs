import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";

export const unlink: (backend: SQLiteBackend) => MountOptions["unlink"] = (
  backend
) => {
  return async (path, cb) => {
    console.log("unlink(%s)", path);
    const r = await backend.deleteFile(path);
    if (r.status === "ok") {
      cb(0);
    } else {
      cb(fuse.ENOENT);
    }
  };
};
