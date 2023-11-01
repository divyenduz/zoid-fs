import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const init: (backend: SQLiteBackend) => MountOptions["init"] = (
  backend
) => {
  return async (cb) => {
    console.info("init");

    //@ts-expect-error fix types
    const context = fuse.context();
    const { uid, gid } = context;

    const rootFolder = await backend.getFileResolved("/");
    match(rootFolder)
      .with({ status: "ok" }, () => {})
      .with({ status: "not_found" }, async () => {
        await backend.createFile("/", "dir", 16877, uid, gid);
      })
      .exhaustive();
    cb(0);
  };
};
