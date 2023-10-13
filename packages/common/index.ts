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

export interface Backend {
  getFiles: (dir: string) => Promise<File[]>;
  getFile: (filepath: string) => Promise<Result<File>>;

  createFile: (
    filepath: string,
    type: FileType,
    mode: number,
    uid: number,
    gid: number,
    targetId: number
  ) => Promise<Result<File>>;

  writeFile: (
    filepath: string,
    content: Buffer,
    uid: number,
    gid: number
  ) => Promise<Result<File>>;

  deleteFile: (filepath: string) => Promise<Result<File>>;
  renameFile: (srcPath: string, destPath: string) => Promise<Result<File>>;
  updateMode: (filepath: string, mode: number) => Promise<Result<File>>;
}
