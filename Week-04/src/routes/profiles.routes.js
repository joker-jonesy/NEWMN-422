import { Router } from "express";
import { prisma } from "../db.js";

export const profilesRouter = Router();

profilesRouter.get("/", async (req, res) => {
  const profiles = await prisma.profile.findMany({ include: { user: true } });
  res.json(profiles);
});

profilesRouter.get("/:id", async (req, res) => {
  const profile = await prisma.profile.findUnique({
    where: { id: Number(req.params.id) },
    include: { user: true },
  });
  if (!profile) return res.status(404).json({ error: "Profile not found" });
  res.json(profile);
});

// attach a Profile to an existing User — "connect" instead of "create"
// because the User already exists (one-to-one, other direction from users.routes.js)
profilesRouter.post("/", async (req, res) => {
  const { bio, userId } = req.body;
  const profile = await prisma.profile.create({
    data: { bio, user: { connect: { id: Number(userId) } } },
    include: { user: true },
  });
  res.status(201).json(profile);
});

profilesRouter.patch("/:id", async (req, res) => {
  const { bio } = req.body;
  const profile = await prisma.profile.update({
    where: { id: Number(req.params.id) },
    data: { bio },
  });
  res.json(profile);
});

profilesRouter.delete("/:id", async (req, res) => {
  await prisma.profile.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
