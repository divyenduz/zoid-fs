import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "node-fuse-bindings";
import { match } from "ts-pattern";

export const read: (backend: SQLiteBackend) => MountOptions["read"] = (
  backend
) => {
  return async (path, fd, buf, len, pos, cb) => {
    const filenameWithoutSlash = path.slice(1);
    if (
      ["._."].includes(filenameWithoutSlash) ||
      filenameWithoutSlash.includes("._")
    ) {
      console.log("read(%s, %d, %d, %d)", path, fd, len, pos);
    } else {
      console.log("read(%s, %d, %o, %d, %d)", path, fd, buf, len, pos);
    }
    const r = await backend.getFile(filenameWithoutSlash);
    match(r)
      .with({ status: "ok" }, (r) => {
        const bufChunk = Buffer.copyBytesFrom(r.file.content, pos, len);
        if (!bufChunk) return cb(0);
        buf.write(bufChunk.toString("binary"), "binary");
        return cb(Buffer.byteLength(bufChunk));
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
