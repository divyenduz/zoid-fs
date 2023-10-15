import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const release: (backend: SQLiteBackend) => MountOptions["release"] = (
  backend
) => {
  return async (path, fd, cb) => {
    console.log("release(%s, %d)", path, fd);
    cb(0);
  };
};
