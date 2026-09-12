import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { referralEarnings } from "../../db/schema.js";
import { requireAuth } from "../../lib/auth.middleware.js";

const router = Router();

router.post("/earnings/release-due", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Используем чистый SQL для надежного сравнения hold_until с NOW() в БД
    const released = await db
      .update(referralEarnings)
      .set({
        status: "AVAILABLE",
        updatedAt: new Date(),
      })
      .where(
        sql`${referralEarnings.beneficiaryId} = ${userId} AND ${referralEarnings.status} = 'PENDING_HOLD' AND ${referralEarnings.holdUntil} <= NOW()`
      )
      .returning();

    res.json({
      released: released.length,
      earnings: released,
    });
  } catch (e) {
    console.error("[earnings/release-due]", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
