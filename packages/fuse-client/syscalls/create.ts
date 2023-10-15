import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const create: (backend: SQLiteBackend) => MountOptions["create"] = (
  backend
) => {
  return async (path, mode, cb) => {
    console.log("create(%s, %d)", path, mode);

    //@ts-expect-error fix types
    const context = fuse.context();
    const { uid, gid } = context;

    const r = await backend.createFile(path, "file", mode, uid, gid);
    if (r.status === "ok") {
      cb(0);
    } else {
      // Handle the error case
      cb(fuse.EACCES);
    }
  };
};
