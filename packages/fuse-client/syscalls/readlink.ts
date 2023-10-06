import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const readlink: (backend: SQLiteBackend) => MountOptions["readlink"] = (
  backend
) => {
  return async (path, cb) => {
    console.log("readlink(%s)", path);
    cb(0, "TODO: implement readlink");
  };
};
