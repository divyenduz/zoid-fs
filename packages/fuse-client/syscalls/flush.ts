import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const flush: (backend: SQLiteBackend) => MountOptions["flush"] = (
  backend
) => {
  return async (path, fd, cb) => {
    console.info("flush(%s, %d)", path, fd);
    await backend.flush(path);
    cb(0);
  };
};
