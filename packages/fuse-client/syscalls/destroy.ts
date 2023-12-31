import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const destroy: (backend: SQLiteBackend) => MountOptions["destroy"] = (
  backend
) => {
  return async (cb) => {
    console.info("destroy");
    await backend.close();
    cb(0);
  };
};
