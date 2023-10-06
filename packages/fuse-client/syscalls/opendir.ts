import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const opendir: (backend: SQLiteBackend) => MountOptions["opendir"] = (
  backend
) => {
  return async (path, flags, cb) => {
    console.log("opendir(%s, %d)", path, flags);
    cb(0, 42); // TODO: get the real fd
  };
};
