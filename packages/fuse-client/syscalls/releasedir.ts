import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const releasedir: (
  backend: SQLiteBackend
) => MountOptions["releasedir"] = (backend) => {
  return async (path, fd, cb) => {
    console.log("releasedir(%s, %d)", path, fd);
    cb(0);
  };
};
