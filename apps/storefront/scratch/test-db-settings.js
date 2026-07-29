const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "default" },
  });
  console.log("Current StoreSettings in DB:", settings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
