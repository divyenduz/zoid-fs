import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const write: (backend: SQLiteBackend) => MountOptions["write"] = (
  backend
) => {
  return async (path, fd, buf, len, pos, cb) => {
    console.log("write(%s, %d, %d, %d)", path, fd, len, pos);
    const chunk = Buffer.from(buf, pos, len);

    const rChunk = await backend.writeFileChunk(path, chunk, pos, len);
    match(rChunk)
      .with({ status: "ok" }, () => {
        cb(chunk.length);
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
