import "dotenv/config";
import express from "express";
import cors from "cors";

import { routes } from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

// src/routes/index.js is the only router index.js knows about — it mounts
// every table's router internally, one level down.
app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({ message: "Prisma relations demo is running" });
});

// Express 5 forwards rejected promises from async handlers here automatically.
// Prisma tags known failures with an error code, so map the common relation
// mistakes to proper HTTP statuses instead of letting them surface as a 500:
//   P2002 - a unique constraint was violated (e.g. double-enrolling a student)
//   P2003 - a foreign key constraint was violated (e.g. deleting a User who
//           still has Posts — the default onDelete is Restrict, unlike the
//           Cascade set on Profile in schema.prisma)
//   P2025 - the record a query expected to find doesn't exist
app.use((err, req, res, next) => {
  const constraint = err.meta?.driverAdapterError?.cause?.constraint?.index;
  if (err.code === "P2002") {
    return res.status(409).json({ error: `Unique constraint violated: ${constraint}` });
  }
  if (err.code === "P2003") {
    return res.status(409).json({ error: `Related records still reference this row: ${constraint}` });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
