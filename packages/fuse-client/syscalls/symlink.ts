import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";
import { constants } from "fs";
import path from "path";

export const symlink: (backend: SQLiteBackend) => MountOptions["symlink"] = (
  backend
) => {
  return async (srcPath, destPath, cb) => {
    console.info("symlink(%s, %s)", srcPath, destPath);

    const parsedDestPath = path.parse(destPath);
    // Note: actually 255 as per the spec but we get an extra / in the dest path
    if (parsedDestPath.base.length > 255) {
      cb(fuse.ENAMETOOLONG);
      return;
    }

    // Note: actually 1023 as per the spec but we get an extra / in the dest path
    if (srcPath.length > 1023 || destPath.length > 1023) {
      cb(fuse.ENAMETOOLONG);
      return;
    }

    //@ts-expect-error fix types
    const context = fuse.context();
    const { uid, gid } = context;

    // TODO: double check if mode for symlink is correct
    // https://unix.stackexchange.com/questions/193465/what-file-mode-is-a-symlink
    const r = await backend.createFile(
      destPath,
      "symlink",
      constants.S_IFLNK,
      uid,
      gid,
      srcPath
    );
    match(r)
      .with({ status: "ok" }, () => {
        cb(0);
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
