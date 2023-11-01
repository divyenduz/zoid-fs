import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";
import { flush } from "./flush";

export const fsync: (backend: SQLiteBackend) => MountOptions["fsync"] = (
  backend
) => {
  return async (path, fd, datasync, cb) => {
    console.info("fsync -> flush(%s, %d, %d)", path, fd, datasync);
    // @ts-expect-error TODO: implement fsync properly
    // We do buffered writes and flush flushes the buffer!
    // A program may not call flush but fsync without relenquishing fd (like SQLite)
    // In our case currently, the implementation of fsync and flush is same!
    flush(backend)(path, fd, cb);
  };
};
