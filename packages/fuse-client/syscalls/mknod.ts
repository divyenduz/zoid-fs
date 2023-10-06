import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const mknod: (backend: SQLiteBackend) => MountOptions["mknod"] = (
  backend
) => {
  return async (path, mode, dev, cb) => {
    console.log("mknod(%s, %d, %d)", path, mode, dev);
    cb(0);
  };
};
