import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const fsyncdir: (backend: SQLiteBackend) => MountOptions["fsyncdir"] = (
  backend
) => {
  return async (path, fd, datasync, cb) => {
    console.info("fsyncdir(%s, %d, %d)", path, fd, datasync);
    cb(0);
  };
};
