import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";
import { getattr } from "./getattr";

export const fgetattr: (backend: SQLiteBackend) => MountOptions["fgetattr"] = (
  backend
) => {
  return async (path, fd, cb) => {
    console.log("fgetattr(%s, %d)", path, fd);
    //@ts-expect-error fix types
    getattr(backend)?.(path, cb);
  };
};
