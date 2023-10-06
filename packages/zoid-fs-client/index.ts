import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { FuseClient } from "@zoid-fs/fuse-client";
import arg from "arg";

const args = arg({
  "--tenant": String,
});

const mountPath = args._[0];
const tenant = args["--tenant"] || "fs";
console.table({
  mountPath,
  tenant,
});

const sqliteBackend = new SQLiteBackend(`file:./${tenant}.db`);

const fuseClient = new FuseClient(sqliteBackend);
setTimeout(async () => {
  console.log("mounting: fuse mount points");
  fuseClient.mountFS(mountPath);
}, 1000);

process.on("SIGINT", () => {
  fuseClient.unmountFS(mountPath);
});
