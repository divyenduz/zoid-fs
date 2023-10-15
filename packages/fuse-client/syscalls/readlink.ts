import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const readlink: (backend: SQLiteBackend) => MountOptions["readlink"] = (
  backend
) => {
  return async (path, cb) => {
    console.log("readlink(%s)", path);
    const r = await backend.getFile(path);
    match(r)
      .with({ status: "ok" }, (r) => {
        cb(0, r.file.name);
      })
      .with({ status: "not_found" }, () => {
        //@ts-expect-error fix types, what to do if readlink fails?
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
