import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { truncate } from "./truncate";

export const ftruncate: (
  backend: SQLiteBackend
) => MountOptions["ftruncate"] = (backend) => {
  return async (path, fd, size, cb) => {
    console.info("ftruncate -> truncate(%s, %d, %d)", path, fd, size);
    //@ts-expect-error fix types
    truncate(backend)(path, size, cb);
  };
};
