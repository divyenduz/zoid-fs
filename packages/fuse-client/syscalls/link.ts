import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const link: (backend: SQLiteBackend) => MountOptions["link"] = (
  backend
) => {
  return async (srcPath, destPath, cb) => {
    console.info("link(%s, %s)", srcPath, destPath);

    // TODO: throw if destination doesn't exist

    // TODO: double check if mode for link is correct
    // https://unix.stackexchange.com/questions/193465/what-file-mode-is-a-link
    const r = await backend.createLink(srcPath, destPath);
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
