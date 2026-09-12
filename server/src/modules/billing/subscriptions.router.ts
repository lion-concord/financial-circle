import { Router } from "express";
import { db } from "../../db/client.js";
import { subscriptions, tariffs } from "../../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

function addOneMonth(d: Date) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1);
  return x;
}

router.post("/subscriptions/activate", async (req, res) => {
  try {
    const { userId, tariffSlug } = req.body as {
      userId?: string;
      tariffSlug?: string;
    };

    if (!userId || !tariffSlug) {
      res.status(400).json({ error: "userId and tariffSlug are required" });
      return;
    }

    const [tariff] = await db
      .select()
      .from(tariffs)
      .where(eq(tariffs.slug, tariffSlug))
      .limit(1);

    if (!tariff || !tariff.isActive) {
      res.status(404).json({ error: "Tariff not found or inactive" });
      return;
    }

    const now = new Date();
    const start = now;
    const end = addOneMonth(now);

    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!existing) {
      const [created] = await db
        .insert(subscriptions)
        .values({
          userId,
          tariffId: tariff.id,
          status: "ACTIVE",
          currentPeriodStart: start,
          currentPeriodEnd: end,
          nextPaymentAt: end,
          externalSubId: null,
          canceledAt: null,
        })
        .returning();

      res.json({ subscription: created });
      return;
    }

    const [updated] = await db
      .update(subscriptions)
      .set({
        tariffId: tariff.id,
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: end,
        nextPaymentAt: end,
        canceledAt: null,
      })
      .where(eq(subscriptions.userId, userId))
      .returning();

    res.json({ subscription: updated });
  } catch (e) {
    console.error("[subscriptions/activate]", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
