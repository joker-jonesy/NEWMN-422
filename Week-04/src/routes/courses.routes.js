import { Router } from "express";
import { prisma } from "../db.js";

export const coursesRouter = Router();

coursesRouter.get("/", async (req, res) => {
  const courses = await prisma.course.findMany({
    include: { enrollments: { include: { student: true } } },
  });
  res.json(courses);
});

coursesRouter.get("/:id", async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: Number(req.params.id) },
    include: { enrollments: { include: { student: true } } },
  });
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(course);
});

coursesRouter.post("/", async (req, res) => {
  const { title, code } = req.body;
  const course = await prisma.course.create({ data: { title, code } });
  res.status(201).json(course);
});

coursesRouter.delete("/:id", async (req, res) => {
  await prisma.course.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
