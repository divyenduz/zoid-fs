import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";
import { match } from "ts-pattern";

export const getattr: (backend: SQLiteBackend) => MountOptions["getattr"] = (
  backend
) => {
  return async (path, cb) => {
    console.log("getattr(%s)", path);
    if (path === "/") {
      cb(0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: 100, // Directory size, chosen arbitrarily
        mode: 16877,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0,
      });
      return;
    }

    const r = await backend.getFile(path);

    await match(r)
      .with({ status: "ok" }, async (r) => {
        const rSize = await backend.getFileSize(path);
        if (rSize.status !== "ok") {
          cb(fuse.ENOENT);
          return;
        }

        const { mtime, atime, ctime, mode } = r.file;
        cb(0, {
          mtime,
          atime,
          ctime,
          nlink: 1,
          size: rSize.size,
          mode: mode,
          uid: process.getuid ? process.getuid() : 0,
          gid: process.getgid ? process.getgid() : 0,
        });
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
