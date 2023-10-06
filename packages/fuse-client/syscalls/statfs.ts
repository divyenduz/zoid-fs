import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const statfs: (backend: SQLiteBackend) => MountOptions["statfs"] = (
  backend
) => {
  return (path, cb) => {
    console.log("statfs(%s)", path);
    // TODO: fill actual values, these are just placeholders
    cb(0, {
      bsize: 1000000, // Block size
      frsize: 1000000, // Fragment size
      blocks: 1000, // Total data blocks in file system
      bfree: 500, // Free blocks in file system
      bavail: 500, // Free blocks available to unprivileged user
      files: 10, // Total file nodes in file system
      ffree: 500, // Free file nodes in file system
      favail: 500, // Free file nodes available to unprivileged user
      fsid: 123456, // File system id
      flag: 1000, // Mount flags
      namemax: 255, // Maximum length of filenames
    });
  };
};
