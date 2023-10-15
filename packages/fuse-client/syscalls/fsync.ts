import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const fsync: (backend: SQLiteBackend) => MountOptions["fsync"] = (
  backend
) => {
  return async (path, fd, datasync, cb) => {
    console.log("fsync(%s, %d, %d)", path, fd, datasync);
    cb(0);
  };
};
