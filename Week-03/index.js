import express from 'express'
import "dotenv/config";
import {PrismaClient} from "./generated/prisma/client.js";
import {PrismaPg} from "@prisma/adapter-pg";

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter});

// initializes the server
const app = express();
const PORT = 3000;

app.use(express.json())

// this is where the route stuff goes

app.get("/bookmarks/:id", async (req, res) => {
    const bookmark = await prisma.bookmark.findUnique({where:{id:Number(req.params.id)}});

    if(!bookmark){
        return res.status(404).send("Bookmark not found!");
    }

    res.json(bookmark);
})

app.post("/bookmarks", async (req, res) => {
    const bookmark = await prisma.bookmark.create({
        data:{
            url:req.body.url,
            title:req.body.title
        }
    })

    res.send(bookmark);
})

app.put("/bookmarks/:id", async (req, res) => {
    const bookmark = await prisma.bookmark.update({
        where:{id:Number(req.params.id)},
        data:{
            url:req.body.url,
            title:req.body.title
        }
    })

    res.send(bookmark);
})

app.delete("/bookmarks/:id", async (req, res) => {
    const bookmark = await prisma.bookmark.delete({where:{id:Number(req.params.id)}});
    res.send(bookmark);
})

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})

// control + c to stop your server

