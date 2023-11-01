import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const setxattr: (backend: SQLiteBackend) => MountOptions["setxattr"] = (
  backend
) => {
  return async (path, name, buffer, length, offset, flags, cb) => {
    console.info(
      "setxattr(%s, %s, %s, %d, %d, %d)",
      path,
      name,
      buffer,
      length,
      offset,
      flags
    );
    cb(0);
  };
};
