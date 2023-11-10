import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { MountOptions } from "@zoid-fs/node-fuse-bindings";

export const readdir: (backend: SQLiteBackend) => MountOptions["readdir"] = (
  backend
) => {
  return async (path, cb) => {
    console.info("readdir(%s)", path);

    const dotDirs = [".", ".."];
    const metaFiles: string[] = backend.getVirtualFilePaths(path);
    const links = await backend.getLinks(path);
    const fileNames = dotDirs
      // Note: trim the first / of /.zoid-meta returning .zoid-meta
      .concat(metaFiles.map((metaFile) => metaFile.slice(1)))
      .concat(links.map((link) => link.name));

    return cb(0, fileNames);
  };
};
