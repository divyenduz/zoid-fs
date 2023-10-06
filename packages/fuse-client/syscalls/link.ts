import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const link: (backend: SQLiteBackend) => MountOptions["link"] = (
  backend
) => {
  return async (src, dest, cb) => {
    console.log("link(%s, %s)", src, dest);
    cb(0);
  };
};
