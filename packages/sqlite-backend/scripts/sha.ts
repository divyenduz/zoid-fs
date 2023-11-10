import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

async function main() {
  const prisma = new PrismaClient();
  const fileBytes = await prisma.content.findMany({
    where: {
      file: {
        Link: {
          some: {
            name: "cv.pdf",
          },
        },
      },
    },
    orderBy: {
      offset: "asc",
    },
  });

  const sha = crypto.createHash("sha256");
  fileBytes.forEach((byteChunk) => {
    sha.update(byteChunk.content);
  });
  const digest = sha.digest();
  console.log(digest.toString("hex"));
}

main();
