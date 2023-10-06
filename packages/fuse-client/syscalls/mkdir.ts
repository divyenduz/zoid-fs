import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";
export const mkdir: (backend: SQLiteBackend) => MountOptions["mkdir"] = (
  backend
) => {
  return async (path, mode, cb) => {
    console.log("mkdir(%s, %s)", path, mode);
    const name = path.slice(1);
    const dir = await backend.createFile(name, "dir");
    if (dir.status === "ok") {
      cb(0);
    } else {
      cb(fuse.EACCES);
    }
  };
};
