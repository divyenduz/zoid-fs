import { describe, expect, test } from "vitest";
import jetpack from "fs-jetpack";

const TEST_FS_PATH = `/home/div/code/vfs/test-fs`;
const TEST_FILE = "dir";

describe.skip("list", () => {
  test("list and write", async () => {
    const cwd = jetpack.cwd(TEST_FS_PATH);
    expect(
      cwd.find({
        matching: TEST_FILE,
      })
    ).toMatchObject([]);
    cwd.dir(TEST_FILE);
    expect(
      cwd.find({
        matching: TEST_FILE,
      })
    ).toMatchObject([TEST_FILE]);
    cwd.remove(TEST_FILE);
    expect(
      cwd.find({
        matching: TEST_FILE,
      })
    ).toMatchObject([]);
  });
});
