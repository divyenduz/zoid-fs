import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";
import { match } from "ts-pattern";

export const opendir: (backend: SQLiteBackend) => MountOptions["opendir"] = (
  backend
) => {
  return async (path, flags, cb) => {
    console.log("opendir(%s, %d)", path, flags);

    if (path === "/") {
      cb(0, 42); // TODO: Universal FD for root dir, it should probably be in the database as bootstrap
      return;
    }

    const r = await backend.getFile(path);
    match(r)
      .with({ status: "ok" }, (r) => {
        cb(0, r.file.id);
      })
      .with({ status: "not_found" }, () => {
        //@ts-expect-error fix types, have no file descriptor to return
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
