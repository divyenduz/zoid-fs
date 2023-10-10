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
    match(r)
      .with({ status: "ok" }, (r) => {
        const { mtime, atime, ctime, uid, gid, mode } = r.file;
        cb(0, {
          mtime,
          atime,
          ctime,
          nlink: 1,
          size: r.file.content.length,
          mode: mode,
          uid: uid,
          gid: gid,
        });
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
