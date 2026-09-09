import "dotenv/config";
import {PrismaClient} from "../generated/prisma/client.js";
import {PrismaPg} from "@prisma/adapter-pg";

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter});

// await prisma.bookmark.create({data: {url:"cool.com", title:"COOL"}})


// const data = await prisma.bookmark.findMany()
// const data = await prisma.bookmark.findUnique({ where: {id:5}})
console.log(data)