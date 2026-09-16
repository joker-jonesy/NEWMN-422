import {Router} from 'express';
import {userRouter} from "./users.js";
import {postRouter} from "./posts.js";


export const routes = Router();
routes.use('/users', userRouter);
routes.use('/posts', postRouter);