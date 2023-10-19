export class WriteBuffer<T> {
  private buffer: Array<T> = [];

  constructor(
    private readonly size: number,
    private readonly writer: (bufferSlice: T[]) => Promise<void>
  ) {}
  async write(item: T): Promise<void> {
    this.buffer.push(item);
    if (this.buffer.length >= this.size) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    const bufferSlice = this.buffer.slice(0);
    this.buffer = [];
    await this.writer(bufferSlice);
  }
}
