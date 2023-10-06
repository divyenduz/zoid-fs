import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const chown: (backend: SQLiteBackend) => MountOptions["chown"] = (
  backend
) => {
  return async (path, uid, gid, cb) => {
    console.log("chown(%s, %d, %d)", path, uid, gid);
    cb(0);
  };
};
