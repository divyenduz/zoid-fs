import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const chown: (backend: SQLiteBackend) => MountOptions["chown"] = (
  backend
) => {
  return async (path, uid, gid, cb) => {
    console.info("chown(%s, %d, %d)", path, uid, gid);
    cb(0);
  };
};
