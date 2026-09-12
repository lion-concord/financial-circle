import { Router } from "express";
import { db } from "../../db/client.js";
import {
  payments,
  users,
  tariffs,
  referralEarnings,
} from "../../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

// MVP: создаём payment-строку
router.post("/payments/create", async (req, res) => {
  try {
    const { userId, tariffSlug, amountKopecks, periodStart, periodEnd, provider } = req.body as {
      userId?: string;
      tariffSlug?: string;
      amountKopecks?: number;
      periodStart?: string;
      periodEnd?: string;
      provider?: string;
    };

    if (!userId || !tariffSlug || !amountKopecks || !periodStart || !periodEnd || !provider) {
      res.status(400).json({ error: "userId, tariffSlug, amountKopecks, periodStart, periodEnd, provider are required" });
      return;
    }

    const [tariff] = await db.select().from(tariffs).where(eq(tariffs.slug, tariffSlug)).limit(1);
    if (!tariff) {
      res.status(404).json({ error: "Tariff not found" });
      return;
    }

    const [payment] = await db
      .insert(payments)
      .values({
        userId,
        tariffId: tariff.id,
        amountKopecks: Math.trunc(amountKopecks),
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: "PENDING",
        provider,
      })
      .returning();

    res.json({ payment });
  } catch (e) {
    console.error("[payments/create]", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// MVP: симулируем успешную оплату и начисляем referral earnings с холдом 15 дней
router.post("/payments/simulate-success", async (req, res) => {
  try {
    const { paymentId } = req.body as { paymentId?: string };
    if (!paymentId) {
      res.status(400).json({ error: "paymentId is required" });
      return;
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    if (payment.status === "SUCCEEDED") {
      res.json({ payment, earnings: [], note: "Already succeeded" });
      return;
    }

    await db
      .update(payments)
      .set({
        status: "SUCCEEDED",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    const [payerUser] = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
    const referrerId = payerUser?.referrerId ?? null;

    if (!referrerId) {
      res.json({ payment: { ...payment, status: "SUCCEEDED" }, earning: null });
      return;
    }

    const [tariff] = await db.select().from(tariffs).where(eq(tariffs.id, payment.tariffId)).limit(1);
    if (!tariff) {
      res.status(500).json({ error: "Tariff for payment not found" });
      return;
    }

    const holdUntil = addDays(new Date(), 15);

    const [earning] = await db
      .insert(referralEarnings)
      .values({
        beneficiaryId: referrerId,
        sourceUserId: payment.userId,
        paymentId: payment.id,
        amountKopecks: Math.trunc(tariff.referralRewardKopecks),
        tariffSlug: tariff.slug,
        status: "PENDING_HOLD",
        holdUntil,
        availableAt: holdUntil,
      })
      .onConflictDoNothing()
      .returning();

    res.json({ paymentId, status: "SUCCEEDED", earning });
  } catch (e) {
    console.error("[payments/simulate-success]", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
