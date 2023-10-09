import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";
import { match } from "ts-pattern";

export const truncate: (backend: SQLiteBackend) => MountOptions["truncate"] = (
  backend
) => {
  return async (path, size, cb) => {
    console.log("truncate(%s, %d)", path, size);
    const r = await backend.getFile(path);
    match(r)
      .with({ status: "ok" }, async (r) => {
        const truncatedContent = r.file.content.slice(0, size);
        const writeResult = await backend.writeFile(path, truncatedContent);
        match(writeResult)
          .with({ status: "ok" }, () => {
            cb(0);
          })
          .with({ status: "not_found" }, () => {
            cb(fuse.ENOENT);
          })
          .exhaustive();
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
