import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const open: (backend: SQLiteBackend) => MountOptions["open"] = (
  backend
) => {
  return async (path, flags, cb) => {
    console.info("open(%s, %d)", path, flags);

    if (backend.isVirtualFile(path)) {
      const virtualFile = backend.getVirtualFile(path);
      cb(0, virtualFile.fileId);
      return;
    }

    const r = await backend.getFile(path);
    match(r)
      .with({ status: "ok" }, (r) => {
        cb(0, r.file.id);
      })
      .with({ status: "not_found" }, async () => {
        /**
         * TODO: this will need to be fixed, this supports jetpack's append function
         * by creating a file that doesn't already exist but breaks cat as cat returns empty
         * for files that don't exist
         */

        //@ts-expect-error fix types
        const context = fuse.context();
        const { uid, gid } = context;

        const newFile = await backend.createFile(path, "file", 33188, uid, gid);
        match(newFile)
          .with({ status: "ok" }, (newFile) => {
            cb(0, newFile.file.id);
          })
          .otherwise(() => {
            //@ts-expect-error fix types, have no file descriptor to return
            cb(fuse.ENOENT);
          });
      })
      .exhaustive();
  };
};
