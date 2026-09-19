import { Router, Response } from "express";
import { requireAuth } from "../../lib/auth.middleware.js";

const router = Router();

// GET /me — текущий пользователь
router.get("/me", requireAuth, async (req: any, res: Response) => {
  try {
    const _userId = req.user?.userId; // из verifyToken()
    // TODO: достать баланс/подписку/рефералы из БД по _userId
    res.json({
      balance: 0,
      hold: 8700,
      referrals: 0,
      subscription: "free",
    });
  } catch (err) {
    console.error("[users/me]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /me/operations — история операций
router.get("/me/operations", requireAuth, async (req: any, res: Response) => {
  try {
    const _userId = req.user?.userId;
    // TODO: достать операции из БД по _userId
    res.json([]);
  } catch (err) {
    console.error("[users/operations]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
