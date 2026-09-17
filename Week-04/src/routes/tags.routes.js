import { Router } from "express";
import { prisma } from "../db.js";

export const tagsRouter = Router();

tagsRouter.get("/", async (req, res) => {
  const tags = await prisma.tag.findMany({ include: { posts: true } });
  res.json(tags);
});

tagsRouter.get("/:id", async (req, res) => {
  const tag = await prisma.tag.findUnique({
    where: { id: Number(req.params.id) },
    include: { posts: true },
  });
  if (!tag) return res.status(404).json({ error: "Tag not found" });
  res.json(tag);
});

tagsRouter.post("/", async (req, res) => {
  const { name } = req.body;
  const tag = await prisma.tag.create({ data: { name } });
  res.status(201).json(tag);
});

tagsRouter.delete("/:id", async (req, res) => {
  // Post <-> Tag is an implicit m-n relation, so deleting a Tag just
  // removes the join-table rows — no cascade config needed.
  await prisma.tag.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
