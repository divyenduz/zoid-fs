import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";

export const unlink: (backend: SQLiteBackend) => MountOptions["unlink"] = (
  backend
) => {
  return async (path, cb) => {
    console.log("unlink(%s)", path);
    const filenameWithoutSlash = path.slice(1);
    const r = await backend.deleteFile(filenameWithoutSlash);
    if (r.status === "ok") {
      cb(0);
    } else {
      cb(fuse.ENOENT);
    }
  };
};
