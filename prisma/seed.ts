import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = "12345678";
  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      fullname: "Admin User",
      email: "admin@user.com",
      isEmailVerified: true,
      hashedPassword,
    },
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
