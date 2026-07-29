import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = "hj7545498@gmail.com";
  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });
  console.log("Updated user role to ADMIN:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
