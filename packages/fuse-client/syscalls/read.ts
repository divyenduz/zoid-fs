import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import fuse, { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { match } from "ts-pattern";

export const read: (backend: SQLiteBackend) => MountOptions["read"] = (
  backend
) => {
  return async (path, fd, buf, len, pos, cb) => {
    console.log("read(%s, %d, %d, %d)", path, fd, len, pos);
    const r = await backend.getFileChunks(fd, pos, len);
    await match(r)
      .with({ status: "ok" }, async (r) => {
        if (r.chunks.length === 0) {
          cb(0);
          return;
        }
        const bufChunk = Buffer.concat(r.chunks.map((chunk) => chunk.content));
        buf.write(bufChunk.toString("binary"), "binary");
        cb(Buffer.byteLength(bufChunk));
      })
      .with({ status: "not_found" }, () => {
        cb(fuse.ENOENT);
      })
      .exhaustive();
  };
};
