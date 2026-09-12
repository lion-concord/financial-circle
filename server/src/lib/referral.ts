import { randomBytes } from "crypto";

export function generateReferralCode(length = 8): string {
  return randomBytes(length)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length)
    .toUpperCase();
}
