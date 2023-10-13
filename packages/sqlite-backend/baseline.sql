-- CreateTable
CREATE TABLE "File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL DEFAULT 0,
    "mode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "dir" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" BLOB NOT NULL,
    "uid" INTEGER NOT NULL,
    "gid" INTEGER NOT NULL,
    "atime" DATETIME NOT NULL,
    "mtime" DATETIME NOT NULL,
    "ctime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "File_path_key" ON "File"("path");

