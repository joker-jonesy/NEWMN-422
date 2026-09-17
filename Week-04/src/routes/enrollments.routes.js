import { Router } from "express";
import { prisma } from "../db.js";

export const enrollmentsRouter = Router();

// This router is the whole point of the explicit many-to-many: Enrollment
// is a real table with its own id and its own data (grade, enrolledAt),
// so — unlike Post <-> Tag — it needs its own routes, not just nested
// writes on Student/Course.
enrollmentsRouter.get("/", async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    include: { student: true, course: true },
  });
  res.json(enrollments);
});

// body: { studentId, courseId, grade? }
enrollmentsRouter.post("/", async (req, res) => {
  const { studentId, courseId, grade } = req.body;
  const enrollment = await prisma.enrollment.create({
    data: {
      student: { connect: { id: Number(studentId) } },
      course: { connect: { id: Number(courseId) } },
      grade,
    },
    include: { student: true, course: true },
  });
  res.status(201).json(enrollment);
});

enrollmentsRouter.patch("/:id", async (req, res) => {
  const { grade } = req.body;
  const enrollment = await prisma.enrollment.update({
    where: { id: Number(req.params.id) },
    data: { grade },
  });
  res.json(enrollment);
});

enrollmentsRouter.delete("/:id", async (req, res) => {
  await prisma.enrollment.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
