import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";
import path from "path";

export const rename: (backend: SQLiteBackend) => MountOptions["rename"] = (
  backend
) => {
  return async (src, dest, cb) => {
    console.log("rename(%s, %s)", src, dest);
    const srcFilename = path.parse(src).base;
    const destFilename = path.parse(dest).base;
    console.log({
      srcFilename,
      destFilename,
    });
    const r = await backend.renameFile(srcFilename, destFilename);
    if (r.status === "ok") {
      console.log("rename(%s, %s) success", src, dest);
      cb(0);
    } else {
      // TODO: can move fail, if yes, when?
      cb(fuse.ENOENT);
    }
  };
};
