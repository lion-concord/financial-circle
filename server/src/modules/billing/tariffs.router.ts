import { Router } from "express";
import { db } from "../../db/client.js";
import { tariffs } from "../../db/schema.js";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/tariffs", async (_req, res) => {
  const rows = await db.select().from(tariffs).orderBy(desc(tariffs.isActive));
  res.json({ tariffs: rows });
});

export default router;
