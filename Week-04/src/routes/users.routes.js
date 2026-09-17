import { Router } from "express";
import { prisma } from "../db.js";

export const usersRouter = Router();

// list users, showing the 1-1 (profile) and 1-n (posts) relations at once
usersRouter.get("/", async (req, res) => {
  const users = await prisma.user.findMany({
    include: { profile: true, posts: true },
  });
  res.json(users);
});

usersRouter.get("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    include: { profile: true, posts: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// nested write: create a User and its Profile in one call (one-to-one)
usersRouter.post("/", async (req, res) => {
  const { name, email, bio } = req.body;
  const user = await prisma.user.create({
    data: {
      name,
      email,
      profile: bio ? { create: { bio } } : undefined,
    },
    include: { profile: true },
  });
  res.status(201).json(user);
});

usersRouter.patch("/:id", async (req, res) => {
  const { name, email } = req.body;
  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { name, email },
  });
  res.json(user);
});

// deleting a User cascades to its Profile (onDelete: Cascade in schema.prisma),
// but fails with a 409 if the User still has Posts — Post.author has no
// onDelete override, so it defaults to Restrict. Delete the User's posts
// first, or add onDelete: Cascade/SetNull to that relation if you want
// different behavior.
usersRouter.delete("/:id", async (req, res) => {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
