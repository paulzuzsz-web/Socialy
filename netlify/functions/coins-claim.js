import { json, errorResponse } from "./utils.js";
import {
  getSessionUserRecord,
  saveUserRecord,
  publicUser,
  DAILY_CLAIM_COINS,
  DAILY_CLAIM_COOLDOWN_MS,
} from "./auth-utils.js";

export default async (req) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const session = await getSessionUserRecord(req);
  if (!session) return errorResponse("Bitte melde dich an.", 401);

  const { key, user } = session;

  const lastClaim = user.lastDailyClaim ? new Date(user.lastDailyClaim).getTime() : 0;
  const now = Date.now();
  const nextClaimAt = lastClaim + DAILY_CLAIM_COOLDOWN_MS;

  if (now < nextClaimAt) {
    return errorResponse("Du hast deine Coins für heute schon abgeholt.", 429);
  }

  user.coins = (user.coins || 0) + DAILY_CLAIM_COINS;
  user.lastDailyClaim = new Date(now).toISOString();
  await saveUserRecord(key, user);

  return json({ user: publicUser(user), claimed: DAILY_CLAIM_COINS });
};

export const config = { path: "/api/coins/claim" };
