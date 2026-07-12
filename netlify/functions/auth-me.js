import { json, errorResponse } from "./utils.js";
import { getSessionUser } from "./auth-utils.js";

export default async (req) => {
  const user = await getSessionUser(req);
  if (!user) return errorResponse("Nicht angemeldet", 401);
  return json({ user });
};

export const config = { path: "/api/auth/me" };
