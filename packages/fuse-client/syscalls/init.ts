import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const init: (backend: SQLiteBackend) => MountOptions["init"] = (
  backend
) => {
  return async (cb) => {
    console.log("init");
    cb(0);
  };
};
