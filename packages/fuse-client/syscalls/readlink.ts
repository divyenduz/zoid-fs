import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const readlink: (backend: SQLiteBackend) => MountOptions["readlink"] = (
  backend
) => {
  return async (path, cb) => {
    console.info("readlink(%s)", path);
    const r = await backend.getFileRaw(path);
    match(r)
      .with({ status: "ok" }, (r) => {
        cb(0, r.file.targetPath);
      })
      .with({ status: "not_found" }, () => {
        //@ts-expect-error fix types, what to do if readlink fails?
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
