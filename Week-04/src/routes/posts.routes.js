import { Router } from "express";
import { prisma } from "../db.js";

export const postsRouter = Router();

// author (1-n) and tags (implicit m-n) both come along via include
postsRouter.get("/", async (req, res) => {
  const posts = await prisma.post.findMany({
    include: { author: true, tags: true },
  });
  res.json(posts);
});

postsRouter.get("/:id", async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: Number(req.params.id) },
    include: { author: true, tags: true },
  });
  if (!post) return res.status(404).json({ error: "Post not found" });
  res.json(post);
});

// body: { title, content, authorId, tagNames: ["prisma", "express"] }
// connectOrCreate reuses a Tag if the name already exists, otherwise makes
// a new one — this is the implicit many-to-many write side.
postsRouter.post("/", async (req, res) => {
  const { title, content, authorId, tagNames = [] } = req.body;
  const post = await prisma.post.create({
    data: {
      title,
      content,
      author: { connect: { id: Number(authorId) } },
      tags: {
        connectOrCreate: tagNames.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    include: { author: true, tags: true },
  });
  res.status(201).json(post);
});

// body: { tagNames: [...] } replaces the full set of tags on this post
postsRouter.patch("/:id", async (req, res) => {
  const { title, content, tagNames } = req.body;
  const post = await prisma.post.update({
    where: { id: Number(req.params.id) },
    data: {
      title,
      content,
      tags: tagNames
        ? {
            set: [],
            connectOrCreate: tagNames.map((name) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined,
    },
    include: { tags: true },
  });
  res.json(post);
});

postsRouter.delete("/:id", async (req, res) => {
  await prisma.post.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
