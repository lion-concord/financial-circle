import { Router, Request, Response } from "express";
import { findOrCreateUser } from "../users/users.service.js";
import { signToken } from "../../lib/jwt.js";

const router = Router();

/**
 * POST /auth/vk
 * Тело: { vkId, firstName, lastName?, avatarUrl?, referralCode? }
 *
 * В продакшене здесь нужно верифицировать подпись VK ID.
 * На этапе MVP принимаем данные напрямую и добавим верификацию перед релизом.
 */
router.post("/vk", async (req: Request, res: Response) => {
  try {
    const { vkId, firstName, lastName, avatarUrl, referralCode } = req.body;

    if (!vkId || !firstName) {
      res.status(400).json({ error: "vkId and firstName are required" });
      return;
    }

    const { user, isNew } = await findOrCreateUser(
      { vkId: String(vkId), firstName, lastName, avatarUrl },
      referralCode
    );

    const token = signToken({ userId: user.id, vkId: user.vkId });

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        referralCode: user.referralCode,
        status: user.status,
      },
      isNew,
    });
  } catch (err) {
    console.error("[auth/vk]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
