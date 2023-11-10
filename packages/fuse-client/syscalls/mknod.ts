import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { create } from "./create";

export const mknod: (backend: SQLiteBackend) => MountOptions["mknod"] = (
  backend
) => {
  return async (path, mode, dev, cb) => {
    console.info("mknod -> create(%s, %d, %d)", path, mode, dev);
    //@ts-expect-error fix types
    create(backend)(path, mode, cb);
  };
};
