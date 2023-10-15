import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const ftruncate: (
  backend: SQLiteBackend
) => MountOptions["ftruncate"] = (backend) => {
  return async (path, fd, size, cb) => {
    console.log("ftruncate(%s, %d, %d)", path, fd, size);
    cb(0);
  };
};
