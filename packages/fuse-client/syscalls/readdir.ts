import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const readdir: (backend: SQLiteBackend) => MountOptions["readdir"] = (
  backend
) => {
  return async (path, cb) => {
    console.info("readdir(%s)", path);

    // TODO: figure out how are these directories in output of ls -la
    const dotDirs = [".", ".."];

    const links = await backend.getLinks(path);
    const fileNames = dotDirs.concat(links.map((link) => link.name));

    return cb(0, fileNames);
  };
};
