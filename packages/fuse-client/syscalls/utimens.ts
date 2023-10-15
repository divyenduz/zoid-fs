import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const utimens: (backend: SQLiteBackend) => MountOptions["utimens"] = (
  backend
) => {
  return async (path, atime, mtime, cb) => {
    console.log("utimens(%s, %s, %s)", path, atime, mtime);
    cb(0);
  };
};
