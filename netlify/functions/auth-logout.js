import { json, errorResponse } from "./utils.js";
import { deleteSession, clearSessionCookieHeader } from "./auth-utils.js";

export default async (req) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  await deleteSession(req);

  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookieHeader() } });
};

export const config = { path: "/api/auth/logout" };
