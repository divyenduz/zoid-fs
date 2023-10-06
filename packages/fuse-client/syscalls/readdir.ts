import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "node-fuse-bindings";

export const readdir: (backend: SQLiteBackend) => MountOptions["readdir"] = (
  backend
) => {
  return async (path, cb) => {
    console.log("readdir(%s)", path);

    // TODO: figure out how are these directories in output of ls -la
    const dotDirs = [".", ".."];

    const files = await backend.getFiles();
    const fileNames = dotDirs.concat(files.map((file) => file.name));
    if (path === "/") {
      return cb(0, fileNames);
    }

    // If not on /, return [], only top level files are supported at the moment
    cb(0, []);
  };
};
