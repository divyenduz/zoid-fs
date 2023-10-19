import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const getxattr: (backend: SQLiteBackend) => MountOptions["getxattr"] = (
  backend
) => {
  return async (path, name, buffer, length, offset, cb) => {
    console.log(
      "getxattr(%s, %s, %o, %d, %d)",
      path,
      name,
      buffer,
      length,
      offset
    );
    cb(0);
  };
};
