import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";
import { symlink } from "./symlink";

export const link: (backend: SQLiteBackend) => MountOptions["link"] = (
  backend
) => {
  return async (src, dest, cb) => {
    console.log("link(%s, %s)", src, dest);
    //@ts-expect-error fix types
    // TODO: implement link properly
    symlink(backend)(src, dest, cb);
  };
};
