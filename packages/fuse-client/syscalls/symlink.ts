import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const symlink: (backend: SQLiteBackend) => MountOptions["symlink"] = (
  backend
) => {
  return async (src, dest, cb) => {
    console.log("symlink(%s, %s)", src, dest);
    cb(0);
  };
};
