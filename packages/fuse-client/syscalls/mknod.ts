import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { create } from "./create";

export const mknod: (backend: SQLiteBackend) => MountOptions["mknod"] = (
  backend
) => {
  return async (path, mode, dev, cb) => {
    console.log("mknod(%s, %d, %d)", path, mode, dev);
    //@ts-expect-error fix types
    // TODO: implement mknod properly
    create(backend)(path, mode, cb);
  };
};
