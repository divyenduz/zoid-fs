import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { getattr } from "./getattr";

export const fgetattr: (backend: SQLiteBackend) => MountOptions["fgetattr"] = (
  backend
) => {
  return async (path, fd, cb) => {
    console.info("fgetattr -> getattr(%s, %d)", path, fd);
    //@ts-expect-error fix types
    getattr(backend)?.(path, cb);
  };
};
