import { Router } from "express";
import { prisma } from "../db.js";

export const enrollmentsRouter = Router();
const GRADE_PATTERN = /^[A-F][+-]?$/;

// This router is the whole point of the explicit many-to-many: Enrollment
// is a real table with its own id and its own data (grade, enrolledAt),
// so — unlike Post <-> Tag — it needs its own routes, not just nested
// writes on Student/Course.
enrollmentsRouter.get("/", async (req, res) => {
  try{
    const enrollments = await prisma.enrollment.findMany({
      include: { student: true, course: true },
    });
    res.json(enrollments);
  } catch(err){
    console.error(err);
    res.status(500).json({error:"Could not load enrollments"});
  }

});

// body: { studentId, courseId, grade? }
enrollmentsRouter.post("/", async (req, res) => {

  if(!req.body){
    return res.status(400).json({error:"Please send a JSON body with this request"});
  }

  const {studentId, courseId, grade} = req.body;

  if(!Number.isInteger(studentId)|| studentId < 1){
    return res.status(400).json({error:"Student id must be an integer"});
  }

  if(!Number.isInteger(courseId)|| courseId < 1){
    return res.status(400).json({error:"Course id must be an integer"});
  }

  if(grade && !GRADE_PATTERN.test(grade)){
    res.status(400).json({error:"Grade must be in correct format like A+ or C-"});
  }






  try {
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
  } catch(err){
    if (err.code ==="P2002"){
      return res.status(409).json({error:"That student was already enrolled in the course"});
    }

    if(err.code){
      return next(err)
    }

    console.error(err);
    res.status(500).json({error:"Could not create enrollment"});
  }

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
