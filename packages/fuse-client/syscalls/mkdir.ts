import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";
import path from "path";
export const mkdir: (backend: SQLiteBackend) => MountOptions["mkdir"] = (
  backend
) => {
  return async (filepath, mode, cb) => {
    console.log("mkdir(%s, %s)", filepath, mode);
    const filename = path.parse(filepath).base;

    if (filename.length > 255) {
      cb(fuse.ENAMETOOLONG);
      return;
    }

    const dir = await backend.createFile(filepath, "dir");
    if (dir.status === "ok") {
      cb(0);
    } else {
      cb(fuse.EACCES);
    }
  };
};
