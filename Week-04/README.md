# Prisma Relations Demo

A small Express + Prisma 7 API built to demo two things in class:

1. **The three relation types in Prisma** — one-to-one, one-to-many, and
   many-to-many (both implicit and explicit).
2. **One route file per table**, wired up with `express.Router()`, instead
   of dumping every endpoint into a single `index.js`.

The domain is split into two unrelated mini-apps so each relation type is
easy to reason about on its own:

- **Blog**: `User` → `Profile` (1-1), `User` → `Post` (1-n), `Post` ↔ `Tag`
  (m-n, implicit)
- **Campus**: `Student` ↔ `Course` through `Enrollment` (m-n, explicit —
  the join table has its own data: `grade`, `enrolledAt`)

## Setup

```bash
npm install
createdb prisma_relations_demo      # or any Postgres database you like
cp .env.example .env                # then edit DATABASE_URL to match
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Server runs on `http://localhost:3000`. Try `GET /api/users`, `/api/posts`,
`/api/students`, etc.

## A Prisma 7 quirk worth explaining to students

Prisma 7's new default generator, `prisma-client`, writes the generated
client as **TypeScript source** (`generated/prisma/client.ts`), even in a
project that's otherwise plain JavaScript. Running it with plain `node`
fails with `ERR_MODULE_NOT_FOUND`.

The generator does expose `generatedFileExtension = "js"` to force a `.js`
extension — it looks like the fix, but it isn't one. It renames the files
without transpiling them, so the output is still full of TypeScript-only
syntax (`export type X<T> = ...`, `import type ...`) that Node's own
parser can't read:

```
$ node -e "import('./generated/prisma/client.js')"
SyntaxError: Unexpected token 'export'
```

This is a known gap — see [prisma/prisma#28116](https://github.com/prisma/prisma/issues/28116).

**The actual fix** is to use the older `prisma-client-js` generator
instead of the new `prisma-client` one. It's the generator every Prisma
version before 7 used by default, it's still fully supported in 7, and it
outputs plain, already-compiled JavaScript (`generated/prisma/index.js`) —
no TypeScript syntax anywhere, no extra runtime needed:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}
```

```js
// src/db.js
import { PrismaClient } from "../generated/prisma/index.js";
```

Run `npx prisma generate`, and `npm start` / `npm run dev` work with plain
`node` — nothing else in this project changes. (A driver adapter is still
required either way; that's a separate Prisma 7 change, unrelated to the
TypeScript output issue.)

## Class walkthrough

### 1. One-to-one — `User` ↔ `Profile`

```prisma
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int  @id @default(autoincrement())
  userId Int  @unique
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

The tell for one-to-one is `@unique` on the foreign key (`Profile.userId`).
Without it, many Profiles could point at the same User and this would
quietly become one-to-many.

- `GET /api/users/:id` → `include: { profile: true }`
- `POST /api/users` with a `bio` field does a **nested create**: one
  `prisma.user.create()` call inserts both rows. See
  [users.routes.js](src/routes/users.routes.js).
- Deleting a User cascades to its Profile (`onDelete: Cascade`) — show
  `DELETE /api/users/:id` and then `GET /api/profiles` to prove it's gone.

### 2. One-to-many — `User` ↔ `Post`

```prisma
model Post {
  authorId Int
  author   User @relation(fields: [authorId], references: [id])
}
```

The foreign key (`authorId`) always lives on the "many" side. `User.posts`
is just the reverse view — nothing is stored there.

- `GET /api/posts` → `include: { author: true }`
- Try `DELETE /api/users/:id` on a User who **has** posts: it 409s, because
  `Post.author` has no `onDelete` override (default is `Restrict`) — a
  direct contrast with the Profile cascade above. Good moment to ask
  "what should happen here instead?" (`Cascade`? `SetNull`, if `authorId`
  were optional?)

### 3. Many-to-many, implicit — `Post` ↔ `Tag`

```prisma
model Post {
  tags Tag[]
}

model Tag {
  posts Post[]
}
```

No foreign key on either model, no `@relation` needed — Prisma creates and
manages a hidden join table for you. Use this shape when the relationship
itself carries no data of its own.

- `POST /api/posts` accepts `tagNames: ["prisma", "express"]` and uses
  `connectOrCreate` per tag — reuses a Tag if the name exists, makes a new
  one otherwise. Run it twice with an overlapping tag list and show that
  the second call reuses the first Tag row instead of duplicating it.

### 4. Many-to-many, explicit — `Student` ↔ `Course` via `Enrollment`

```prisma
model Enrollment {
  studentId  Int
  courseId   Int
  student    Student @relation(fields: [studentId], references: [id])
  course     Course  @relation(fields: [courseId], references: [id])
  grade      String?
  enrolledAt DateTime @default(now())

  @@unique([studentId, courseId])
}
```

This is the payoff question for the implicit example above: **what if the
relationship needs its own data?** A Tag either labels a Post or it
doesn't — but an Enrollment has a grade and a date. That extra data is
exactly why this join table is modeled explicitly, as a real table with its
own `id`, rather than left implicit.

- `Enrollment` gets its own full router
  ([enrollments.routes.js](src/routes/enrollments.routes.js)) — `POST`,
  `PATCH` (update a grade), `DELETE` (unenroll). Implicit m-n relations
  never need this because there's no extra data to manage.
- `@@unique([studentId, courseId])` stops a student from enrolling in the
  same course twice. `POST` the same pair again on stage and show the
  clean `409` (see the error handler below) instead of a raw DB stack
  trace.

## Router-per-table pattern

```
src/
  db.js                       one shared PrismaClient instance
  index.js                    creates the app, mounts routes/index.js, error handler
  routes/
    index.js                  imports every table router, mounts each on its path
    users.routes.js
    profiles.routes.js
    posts.routes.js
    tags.routes.js
    students.routes.js
    courses.routes.js
    enrollments.routes.js
```

Each `*.routes.js` file owns exactly one table: it imports the shared
`prisma` client from `db.js` and exports an `express.Router()`. None of
them are mounted in `index.js` directly — instead, they're all collected
in one place, [`routes/index.js`](src/routes/index.js):

```js
// src/routes/index.js
export const routes = Router();

routes.use("/users", usersRouter);
routes.use("/posts", postsRouter);
// ...one line per table
```

`src/index.js` then only has to know about that single router:

```js
// src/index.js
import { routes } from "./routes/index.js";

app.use("/api", routes);
```

This is the payoff of the pattern: adding an eighth table means adding one
new `*.routes.js` file and one new line in `routes/index.js` —
`src/index.js` never has to change. Compare that to mounting all seven
routers directly on `app`, which is what this repo did before this file
existed: every new table meant editing the app's entry point, and
`index.js` grew a new import for every table in the schema.

Worth pointing out: `Enrollment` — the explicit join table — gets its own
router just like everything else, because from Express's point of view
it's just another table with a CRUD lifecycle. `Tag`, the implicit join,
has a router too, but posts.routes.js never calls it directly; tags on a
post are managed through the `Post` model's own relation fields.

## Mapping Prisma errors to HTTP statuses

[src/index.js](src/index.js) has a small error-handling middleware that
turns common Prisma error codes into sensible responses instead of a bare
500:

| Prisma code | Meaning | HTTP status |
| --- | --- | --- |
| `P2002` | Unique constraint violated | 409 |
| `P2003` | Foreign key constraint violated | 409 |
| `P2025` | Expected record not found | 404 |

Because routes use `async` handlers with no `try/catch`, Express 5
forwards any rejected promise (including these Prisma errors) straight to
that middleware automatically.
