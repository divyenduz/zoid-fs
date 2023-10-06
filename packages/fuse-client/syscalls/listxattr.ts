import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const listxattr: (
  backend: SQLiteBackend
) => MountOptions["listxattr"] = (backend) => {
  return async (path, buffer, length, cb) => {
    console.log("listxattr(%s, %d, %d)", path, buffer, length);
    cb(0, 0);
  };
};
