-- CreateTable
DROP TABLE IF EXISTS "File";
CREATE TABLE "File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL DEFAULT 0,
    "mode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "dir" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "uid" INTEGER NOT NULL,
    "gid" INTEGER NOT NULL,
    "atime" DATETIME NOT NULL,
    "mtime" DATETIME NOT NULL,
    "ctime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS "Content";
-- CreateTable
CREATE TABLE "Content" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" BLOB NOT NULL,
    "offset" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    CONSTRAINT "Content_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "File_path_key" ON "File"("path");

