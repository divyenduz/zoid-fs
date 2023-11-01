import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const access: (backend: SQLiteBackend) => MountOptions["access"] = (
  backend
) => {
  return async (path, mode, cb) => {
    console.info("access(%s, %d)", path, mode);
    cb(0);
  };
};
