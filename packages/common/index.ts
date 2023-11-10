import { File, Link } from "@prisma/client";

type FileType = "file" | "dir" | "symlink";

type Result<T, K extends string = "file"> =
  | ({
      status: "ok";
    } & { [P in K]: T })
  | {
      status: "not_found";
    };

// TODO: bump this based on the latest state of the actual backend!

export interface Backend {
  getLinks: (dir: string) => Promise<Link[]>;
  getLink: (dir: string) => Promise<Result<Link, "link">>;
  getFile: (filepath: string) => Promise<Result<File>>;

  createFile: (
    filepath: string,
    type: FileType,
    mode: number,
    uid: number,
    gid: number,
    targetPath: string
  ) => Promise<Result<File>>;

  deleteFile: (filepath: string) => Promise<Result<number, "count">>;
  renameFile: (
    srcPath: string,
    destPath: string
  ) => Promise<Result<Link, "link">>;
  updateMode: (filepath: string, mode: number) => Promise<Result<File>>;
}
