import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const db = new PrismaClient();

async function main() {
  const password = "12345678";
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await db.user.create({
    data: {
      fullName: "Admin User",
      email: "admin@user.com",
      isEmailVerified: true,
      hashedPassword,
    },
  });

  const student = await db.user.create({
    data: {
      fullName: "Student User",
      email: "student@user.com",
      isEmailVerified: true,
      hashedPassword,
    },
  });

  const teacher = await db.user.create({
    data: {
      fullName: "Teacher User",
      email: "teacher@user.com",
      isEmailVerified: true,
      hashedPassword,
    },
  });

  await db.school.create({
    data: {
      name: "My School",
      members: {
        createMany: {
          data: [
            {
              userId: admin.id,
              role: "SUPER_ADMIN",
            },
            {
              userId: teacher.id,
              role: "TEACHER",
            },
            {
              userId: student.id,
              role: "STUDENT",
            },
          ],
        },
      },
    },
  });
}
main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
