import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const chmod: (backend: SQLiteBackend) => MountOptions["chmod"] = (
  backend
) => {
  return async (path, mode, cb) => {
    console.log("chmod(%s, %d)", path, mode);
    cb(0);
  };
};
