import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const db = new PrismaClient();

async function main() {
  const password = "12345678";
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await db.user.create({
    data: {
      fullname: "Admin User",
      email: "admin@user.com",
      isEmailVerified: true,
      hashedPassword,
    },
  });

  const student = await db.user.create({
    data: {
      fullname: "Student User",
      email: "student@user.com",
      isEmailVerified: true,
      hashedPassword,
    },
  });

  const teacher = await db.user.create({
    data: {
      fullname: "Teacher User",
      email: "teacher@user.com",
      isEmailVerified: true,
      hashedPassword,
    },
  });

  const school = await db.school.create({
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
              role: "STUDENT",
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
