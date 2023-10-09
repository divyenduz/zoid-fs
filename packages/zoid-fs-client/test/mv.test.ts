import { describe, expect, test } from "vitest";
import jetpack from "fs-jetpack";

const TEST_FS_PATH = `/home/div/code/vfs/test-fs`;
const TEST_FILE = "mv.txt";

describe("move", () => {
  // TODO: add test case for move when target already exists!!
  // TODO: add test case for move a file that doesn't exist

  test("move on same fs", async () => {
    const cwd = jetpack.cwd(TEST_FS_PATH);
    cwd.remove(TEST_FILE);
    cwd.remove("mv2.txt");
    expect(
      cwd.find({
        matching: TEST_FILE,
      })
    ).toMatchObject([]);

    cwd.write(TEST_FILE, "hello world");
    expect(
      cwd.find({
        matching: TEST_FILE,
      })
    ).toMatchObject([TEST_FILE]);

    cwd.move(TEST_FILE, "mv2.txt");
    expect(
      cwd.find({
        matching: [TEST_FILE, "mv2.txt"],
      })
    ).toMatchObject(["mv2.txt"]);

    cwd.remove(TEST_FILE);
    cwd.remove("mv2.txt");
    expect(
      cwd.find({
        matching: [TEST_FILE, "move2.txt"],
      })
    ).toMatchObject([]);
  });
});
