import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const unlink: (backend: SQLiteBackend) => MountOptions["unlink"] = (
  backend
) => {
  return async (path, cb) => {
    console.info("unlink(%s)", path);

    if (backend.isVirtualFile(path)) {
      cb(0);
      return;
    }

    const r = await backend.deleteFile(path);
    if (r.status === "ok") {
      cb(0);
    } else {
      cb(fuse.ENOENT);
    }
  };
};
