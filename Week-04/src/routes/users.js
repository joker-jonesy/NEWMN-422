import {Router} from 'express';
import {prisma} from '../db.js';

export const userRouter = Router();

userRouter.get('/', async (req, res) => {
    const users = await prisma.user.findMany()
    res.json(users);
})

userRouter.post('/', async (req, res) => {
    const {username, bio} = req.body;
    console.log(req.body)
    const user = await prisma.user.create({
        data:{
            username,
            profile: bio ? {create: {bio}}: undefined
        },
        include: {
            profile: true
        }
    })

    res.status(201).json(user);
})
