import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const link: (backend: SQLiteBackend) => MountOptions["link"] = (
  backend
) => {
  return async (srcPath, destPath, cb) => {
    console.info("link(%s, %s)", srcPath, destPath);

    // TODO: throw if destination doesn't exist

    //@ts-expect-error fix types
    const context = fuse.context();
    const { uid, gid } = context;

    // TODO: double check if mode for link is correct
    // https://unix.stackexchange.com/questions/193465/what-file-mode-is-a-link
    const r = await backend.createFile(
      destPath,
      "link",
      41453, // Link's mode??? from node-fuse-binding source, why though?
      uid,
      gid,
      srcPath
    );
    console.log({ r });
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
