import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const rename: (backend: SQLiteBackend) => MountOptions["rename"] = (
  backend
) => {
  return async (srcPath, destPath, cb) => {
    console.info("rename(%s, %s)", srcPath, destPath);

    if (backend.isVirtualFile(srcPath)) {
      await backend.createFile(destPath, "file", 33188, 0, 0);
      cb(0);
      return;
    }

    const r = await backend.renameFile(srcPath, destPath);
    if (r.status === "ok") {
      cb(0);
    } else {
      // TODO: can move fail, if yes, when?
      // For example when dest doesn't exist??
      cb(fuse.ENOENT);
    }
  };
};
