import { SQLiteBackend } from "@zoid-fs/sqlite-backend";
import { FuseClient } from "@zoid-fs/fuse-client";
import arg from "arg";
import { match } from "ts-pattern";
import { TursoBackend } from "../turso-backend";

type BackendType = "sqlite" | "turso";
const args = arg({
  "--tenant": String,
  "--backend": String, // sqlite or turso
});

const mountPathArg = args._[0];
const tenantArg = args["--tenant"] || "fs";
const backendArg = (args["--backend"] || "sqlite") as BackendType;

console.table({
  backend: backendArg,
  mountPath: mountPathArg,
  tenant: tenantArg,
});

const backend = await match(backendArg)
  .with("sqlite", () => {
    return new SQLiteBackend(`file:./${tenantArg}.db`);
  })
  .with("turso", async () => {
    const tursoBackend = new TursoBackend();
    await tursoBackend.sync();
    return tursoBackend;
  })
  .exhaustive();

const fuseClient = new FuseClient(backend);
setTimeout(async () => {
  console.log("mounting: fuse mount points");
  fuseClient.mountFS(mountPathArg);
}, 1000);

process.on("SIGINT", () => {
  fuseClient.unmountFS(mountPathArg);
});
