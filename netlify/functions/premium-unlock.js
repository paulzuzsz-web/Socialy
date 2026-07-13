import { json, errorResponse } from "./utils.js";
import { getSessionUserRecord, saveUserRecord, publicUser, PREMIUM_COST_COINS } from "./auth-utils.js";

export default async (req) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const session = await getSessionUserRecord(req);
  if (!session) return errorResponse("Bitte melde dich an.", 401);

  const { key, user } = session;

  if (user.isPremium) {
    return json({ user: publicUser(user) });
  }

  if ((user.coins || 0) < PREMIUM_COST_COINS) {
    return errorResponse(`Du brauchst ${PREMIUM_COST_COINS} Coins für Premium.`, 400);
  }

  user.coins -= PREMIUM_COST_COINS;
  user.isPremium = true;
  await saveUserRecord(key, user);

  return json({ user: publicUser(user) });
};

export const config = { path: "/api/premium/unlock" };
