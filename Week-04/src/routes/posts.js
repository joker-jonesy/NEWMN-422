import { Router } from "express";
import {prisma} from "../db.js";

export const postRouter = Router();

postRouter.get("/:id", async (req, res) => {
    const post = await prisma.post.findUnique({
        where:{id: Number(req.params.id)},
        include: {author: true, tags:true}
    })

    res.json(post);
})

postRouter.post("/", async (req, res)=>{
    const {content, authorId, tagNames} = req.body
    console.log(tagNames)
    const post = await prisma.post.create({
        data:{
            content,
            author:{connect:{id: Number(authorId)}},
            tags:{
               connectOrCreate: tagNames.map((name)=>({
                   where: {name},
                   create: {name}
               }))
            }
        },
        include: {author:true, tags:true}
    })

    res.status(201).send(post);
})