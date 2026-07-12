import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";
import { verifyPassword, createSession, sessionCookieHeader } from "./auth-utils.js";

export default async (req) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Ungültiger Request-Body");
  }

  const username = (body.username || "").trim();
  const password = body.password || "";
  if (!username || !password) {
    return errorResponse("Benutzername und Passwort erforderlich");
  }

  const key = username.toLowerCase();
  const usersStore = getStore("users");
  const user = await usersStore.get(key, { type: "json" });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return errorResponse("Benutzername oder Passwort ist falsch", 401);
  }

  const token = await createSession(key);

  return json(
    { user: { username: user.username, createdAt: user.createdAt } },
    { headers: { "Set-Cookie": sessionCookieHeader(token) } }
  );
};

export const config = { path: "/api/auth/login" };
