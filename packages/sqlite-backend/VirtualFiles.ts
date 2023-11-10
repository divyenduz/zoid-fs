import { VirtualFile } from "./VirtualFile";

export class VirtualFiles {
  constructor(private _files: Map<string, VirtualFile>) {}

  filePaths(path: string) {
    if (path === "/") {
      return Array.from(this._files.keys());
    }
    return [];
  }

  isVirtualFile(path: string) {
    // TODO: find correct directory
    return this._files.has(path);
  }

  getVirtualFile(path: string) {
    return this._files.get(path);
  }
}
