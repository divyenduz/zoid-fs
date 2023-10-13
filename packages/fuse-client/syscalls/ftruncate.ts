import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";
import { truncate } from "./truncate";

export const ftruncate: (
  backend: SQLiteBackend
) => MountOptions["ftruncate"] = (backend) => {
  return async (path, fd, size, cb) => {
    console.log("ftruncate(%s, %d, %d)", path, fd, size);
    //@ts-expect-error fix types
    // TODO: implement ftruncate properly
    truncate(backend)(path, size, cb);
  };
};
