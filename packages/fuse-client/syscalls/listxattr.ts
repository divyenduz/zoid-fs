import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const listxattr: (
  backend: SQLiteBackend
) => MountOptions["listxattr"] = (backend) => {
  return async (path, buffer, length, cb) => {
    console.info("listxattr(%s, %d, %d)", path, buffer, length);
    cb(0, 0);
  };
};
