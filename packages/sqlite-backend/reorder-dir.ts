import { PrismaClient } from "@zoid-fs/sqlite-backend";

async function main() {
  const prisma = new PrismaClient();
  const files = await prisma.metaData.findMany({
    where: {
      status: "DONE",
      date: {
        not: null,
      },
    },
  });

  let mkdirStatements = new Set();
  let moveStatements = new Set();

  for (const file of files) {
    const link = await prisma.link.findFirstOrThrow({
      where: {
        fileId: file.fileId,
      },
    });

    const year = file.date!.getFullYear().toString();
    const month = ("0" + (file.date!.getMonth() + 1)).slice(-2);

    if (link.dir.startsWith(`/${year}/${month}`)) {
      continue;
    }

    const newDir = `${year}/${month}`;
    mkdirStatements.add(`mkdir -p ${newDir}`);
    const targetPath = `${link.dir}${link.name}`.slice(1);
    moveStatements.add(`mv ${targetPath} ${newDir}/${link.name}`);
  }

  console.log([...mkdirStatements].join("\n"));
  console.log([...moveStatements].join("\n"));
}

main();
