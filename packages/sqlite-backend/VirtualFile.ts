export class VirtualFile {
  private _date = new Date();
  constructor(
    private _fileId: number,
    private _path: string,
    private _content: string
  ) {}

  get path() {
    return this._path;
  }

  get fileId() {
    return this._fileId;
  }

  getBuffer() {
    return Buffer.from(this._content);
  }

  getSize() {
    return Buffer.byteLength(this.getBuffer());
  }

  getAttr() {
    return {
      mtime: this._date,
      atime: this._date,
      ctime: this._date,
      blocks: 1,
      ino: this.fileId,
      nlink: 1,
      size: this.getSize(),
      mode: 33188,
      uid: process.getuid ? process.getuid() : 0,
      gid: process.getgid ? process.getgid() : 0,
    };
  }
}
