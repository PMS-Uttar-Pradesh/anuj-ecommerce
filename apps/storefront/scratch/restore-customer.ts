import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = "hj7545498@gmail.com";
  const user = await prisma.user.update({
    where: { email },
    data: { role: "CUSTOMER" },
  });
  console.log("Restored user role to CUSTOMER:", user.email, user.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
