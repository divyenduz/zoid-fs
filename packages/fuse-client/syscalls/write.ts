import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const write: (backend: SQLiteBackend) => MountOptions["write"] = (
  backend
) => {
  return async (path, fd, buf, len, pos, cb) => {
    console.info("write(%s, %d, %d, %d)", path, fd, len, pos);

    if (backend.isVirtualFile(path)) {
      const chunk = Buffer.from(buf, pos, len);
      cb(chunk.length);
      return;
    }

    const chunk = Buffer.from(buf, pos, len);
    // TODO: This may throw (because of flush!, what should happen then?)
    await backend.write(path, { content: chunk, offset: pos, size: len });
    cb(chunk.length);
  };
};
