import { Router } from "express";
import { prisma } from "../db.js";

export const studentsRouter = Router();

// enrollments is the explicit join model — include it, then its course,
// to walk Student -> Enrollment -> Course
studentsRouter.get("/", async (req, res) => {
  const students = await prisma.student.findMany({
    include: { enrollments: { include: { course: true } } },
  });
  res.json(students);
});

studentsRouter.get("/:id", async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { id: Number(req.params.id) },
    include: { enrollments: { include: { course: true } } },
  });
  if (!student) return res.status(404).json({ error: "Student not found" });
  res.json(student);
});

studentsRouter.post("/", async (req, res) => {
  const { name, email } = req.body;
  const student = await prisma.student.create({ data: { name, email } });
  res.status(201).json(student);
});

studentsRouter.delete("/:id", async (req, res) => {
  await prisma.student.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
