import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const removexattr: (
  backend: SQLiteBackend
) => MountOptions["removexattr"] = (backend) => {
  return async (path, name, cb) => {
    console.log("removexattr(%s, %s)", path, name);
    cb(0);
  };
};
