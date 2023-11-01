import { File } from "@prisma/client";

type FileType = "file" | "dir" | "symlink";

type Result<T> =
  | {
      status: "ok";
      file: T;
    }
  | {
      status: "not_found";
    };

// TODO: bump this based on the latest state of the actual backend!

export interface Backend {
  getFiles: (dir: string) => Promise<File[]>;
  getFileRaw: (filepath: string) => Promise<Result<File>>;
  getFileResolved: (filepath: string) => Promise<Result<File>>;

  createFile: (
    filepath: string,
    type: FileType,
    mode: number,
    uid: number,
    gid: number,
    targetPath: string
  ) => Promise<Result<File>>;

  writeFile: (
    filepath: string,
    uid: number,
    gid: number
  ) => Promise<Result<File>>;

  deleteFile: (filepath: string) => Promise<Result<number>>;
  renameFile: (srcPath: string, destPath: string) => Promise<Result<File>>;
  updateMode: (filepath: string, mode: number) => Promise<Result<File>>;
}
