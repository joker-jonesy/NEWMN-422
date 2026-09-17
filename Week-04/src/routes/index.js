import { Router } from "express";

import { usersRouter } from "./users.routes.js";
import { profilesRouter } from "./profiles.routes.js";
import { postsRouter } from "./posts.routes.js";
import { tagsRouter } from "./tags.routes.js";
import { studentsRouter } from "./students.routes.js";
import { coursesRouter } from "./courses.routes.js";
import { enrollmentsRouter } from "./enrollments.routes.js";

// Every table's router gets mounted here, once, instead of index.js
// knowing about all seven of them individually. Adding a table means
// adding one line to this file — index.js never changes.
export const routes = Router();

routes.use("/users", usersRouter);
routes.use("/profiles", profilesRouter);
routes.use("/posts", postsRouter);
routes.use("/tags", tagsRouter);
routes.use("/students", studentsRouter);
routes.use("/courses", coursesRouter);
routes.use("/enrollments", enrollmentsRouter);
