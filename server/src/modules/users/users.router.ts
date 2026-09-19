import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../../lib/auth.middleware.js";

const router = Router();

// GET /me — текущий пользователь
router.get("/me", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // TODO: достать юзера из БД по req.user.userId
    res.json({
      balance: 0,
      hold: 8700,
      referrals: 0,
      subscription: "free"
    });
  } catch (err) {
    console.error("[users/me]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /me/operations — история операций
router.get("/me/operations", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    res.json([]);
  } catch (err) {
    console.error("[users/operations]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
