{ pkgs ? import <nixpkgs> {} }:

let lib = pkgs.lib;

in pkgs.mkShell (with pkgs; {
	buildInputs = [
	  nodejs
	  openssl
	  fuse
	];

	shellHook = ''PATH="$PWD/node_modules/.bin:$PATH"'';

	PKG_CONFIG_PATH = "${fuse}/lib/pkgconfig/:$PKG_CONFIG_PATH";

	PRISMA_MIGRATION_ENGINE_BINARY = "/home/divyendusingh/zoid/prisma-engines/target/release/migration-engine";
	PRISMA_SCHEMA_ENGINE_BINARY = "/home/divyendusingh/zoid/prisma-engines/target/release/schema-engine";
	PRISMA_QUERY_ENGINE_BINARY = "/home/divyendusingh/zoid/prisma-engines/target/release/query-engine";
	PRISMA_QUERY_ENGINE_LIBRARY = "/home/divyendusingh/zoid/prisma-engines/target/release/libquery_engine.node";
	PRISMA_INTROSPECTION_ENGINE_BINARY = "/home/divyendusingh/zoid/prisma-engines/target/release/introspection-engine";
	PRISMA_FMT_BINARY = "/home/divyendusingh/zoid/prisma-engines/target/release/prisma-fmt";
})
