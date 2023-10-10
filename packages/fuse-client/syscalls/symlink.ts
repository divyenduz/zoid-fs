import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";
import { match } from "ts-pattern";

export const symlink: (backend: SQLiteBackend) => MountOptions["symlink"] = (
  backend
) => {
  return async (srcPath, destPath, cb) => {
    console.log("symlink(%s, %s)", srcPath, destPath);

    const targetFile = await backend.getFile(srcPath);
    console.log({ targetFile });
    if (targetFile.status === "not_found") {
      cb(fuse.ENOENT);
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
      33188,
      uid,
      gid,
      targetFile.file.id
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
