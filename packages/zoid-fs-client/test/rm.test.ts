import { describe, expect, test } from "vitest";
import jetpack from "fs-jetpack";

const TEST_FS_PATH = `/home/div/code/vfs/test-fs`;
const TEST_FILE = "remove.txt";

describe("remove", () => {
  test("remove file that exists", async () => {
    const cwd = jetpack.cwd(TEST_FS_PATH);
    cwd.write("remove.txt", "hello world");
    expect(
      cwd.find({
        matching: TEST_FILE,
      })
    ).toMatchObject(["remove.txt"]);

    cwd.remove("remove.txt");
    expect(
      cwd.find({
        matching: TEST_FILE,
      })
    ).toMatchObject([]);
  });

  test("remove file that doesn't exist", async () => {
    const cwd = jetpack.cwd(TEST_FS_PATH);
    expect(
      cwd.find({
        matching: TEST_FILE,
      })
    ).toMatchObject([]);
    // Note: jetpack doesn't throw, not rm behavior
    cwd.remove("remove.txt");
    expect(
      cwd.find({
        matching: TEST_FILE,
      })
    ).toMatchObject([]);
  });
});
