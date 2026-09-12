import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { users } from "../../db/schema.js";
import { generateReferralCode } from "../../lib/referral.js";

export type VKProfile = {
  vkId: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
};

export async function findUserByVkId(vkId: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.vkId, vkId))
    .limit(1);
  return result[0] ?? null;
}

export async function findUserByReferralCode(code: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.referralCode, code))
    .limit(1);
  return result[0] ?? null;
}

export async function createUser(
  profile: VKProfile,
  referrerId?: string
) {
  // Генерируем уникальный реферальный код
  let referralCode = generateReferralCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await findUserByReferralCode(referralCode);
    if (!existing) break;
    referralCode = generateReferralCode();
    attempts++;
  }

  const [user] = await db
    .insert(users)
    .values({
      vkId: profile.vkId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      referralCode,
      referrerId: referrerId ?? null,
    })
    .returning();

  return user;
}

export async function findOrCreateUser(
  profile: VKProfile,
  referralCode?: string
) {
  // Ищем существующего пользователя
  const existing = await findUserByVkId(profile.vkId);
  if (existing) return { user: existing, isNew: false };

  // Определяем пригласившего
  let referrerId: string | undefined;
  if (referralCode) {
    const referrer = await findUserByReferralCode(referralCode);
    // Проверяем что не самоприглашение (vkId совпадает)
    if (referrer && referrer.vkId !== profile.vkId) {
      referrerId = referrer.id;
    }
  }

  const user = await createUser(profile, referrerId);
  return { user, isNew: true };
}
