import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const destroy: (backend: SQLiteBackend) => MountOptions["destroy"] = (
  backend
) => {
  return async (cb) => {
    console.log("destroy");
    cb(0);
  };
};
