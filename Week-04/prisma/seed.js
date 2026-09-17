import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // wipe existing data, children first so foreign keys don't block deletes
  await prisma.enrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.course.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // one-to-one + one-to-many: a User, its Profile, and two Posts
  const ada = await prisma.user.create({
    data: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      profile: { create: { bio: "First programmer." } },
      posts: {
        create: [
          { title: "Hello, Engine", content: "Notes on the Analytical Engine." },
          { title: "On Algorithms", content: "Thoughts on step-by-step computation." },
        ],
      },
    },
    include: { profile: true, posts: true },
  });

  // many-to-many (implicit): tag one of Ada's posts
  await prisma.post.update({
    where: { id: ada.posts[0].id },
    data: {
      tags: {
        connectOrCreate: [
          { where: { name: "history" }, create: { name: "history" } },
          { where: { name: "computing" }, create: { name: "computing" } },
        ],
      },
    },
  });

  // many-to-many (explicit): two students enrolling in two courses
  const grace = await prisma.student.create({
    data: { name: "Grace Hopper", email: "grace@example.com" },
  });
  const alan = await prisma.student.create({
    data: { name: "Alan Turing", email: "alan@example.com" },
  });

  const dbCourse = await prisma.course.create({
    data: { title: "Databases", code: "CS-201" },
  });
  const webCourse = await prisma.course.create({
    data: { title: "Web Programming", code: "CS-330" },
  });

  await prisma.enrollment.createMany({
    data: [
      { studentId: grace.id, courseId: dbCourse.id, grade: "A" },
      { studentId: grace.id, courseId: webCourse.id },
      { studentId: alan.id, courseId: dbCourse.id, grade: "A-" },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
