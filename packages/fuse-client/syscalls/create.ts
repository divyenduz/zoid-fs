import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";

export const create: (backend: SQLiteBackend) => MountOptions["create"] = (
  backend
) => {
  return async (path, mode, cb) => {
    console.log("create(%s, %d)", path, mode);
    const r = await backend.createFile(path);
    if (r.status === "ok") {
      cb(0);
    } else {
      // Handle the error case
      cb(fuse.EACCES);
    }
  };
};
