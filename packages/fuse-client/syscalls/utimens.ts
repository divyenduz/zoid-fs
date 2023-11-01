import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const utimens: (backend: SQLiteBackend) => MountOptions["utimens"] = (
  backend
) => {
  return async (path, atime, mtime, cb) => {
    console.info("utimens(%s, %s, %s)", path, atime, mtime);
    try {
      await backend.updateTimes(path, atime, mtime);
    } catch (e) {
      console.error(e);
    }
    cb(0);
  };
};
