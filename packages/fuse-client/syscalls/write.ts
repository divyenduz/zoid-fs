import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";
import { match } from "ts-pattern";

export const write: (backend: SQLiteBackend) => MountOptions["write"] = (
  backend
) => {
  return async (path, fd, buf, len, pos, cb) => {
    console.log("write(%s, %d, %o, %d, %d)", path, fd, buf, len, pos);
    const chunk = Buffer.from(buf, pos, len);

    const oldContentResult = await backend.getFile(path);
    const oldContent = match(oldContentResult)
      .with({ status: "ok" }, (r) => r.file.content)
      .otherwise(() => Buffer.from(""));

    const newContent = Buffer.concat([oldContent, chunk]);

    const r = await backend.writeFile(path, newContent);
    match(r)
      .with({ status: "ok" }, (r) => {
        cb(chunk.length);
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
