import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";
import { hashPassword, createSession, sessionCookieHeader, publicUser, SIGNUP_BONUS_COINS } from "./auth-utils.js";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

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

  if (!USERNAME_RE.test(username)) {
    return errorResponse("Benutzername muss 3–24 Zeichen lang sein (Buchstaben, Zahlen, _)");
  }
  if (password.length < 6) {
    return errorResponse("Passwort muss mindestens 6 Zeichen lang sein");
  }

  const key = username.toLowerCase();
  const usersStore = getStore("users");
  const existing = await usersStore.get(key, { type: "json" });
  if (existing) {
    return errorResponse("Dieser Benutzername ist bereits vergeben", 409);
  }

  const user = {
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    coins: SIGNUP_BONUS_COINS,
    isPremium: false,
    lastDailyClaim: null,
  };
  await usersStore.setJSON(key, user);

  const token = await createSession(key);

  return json(
    { user: publicUser(user) },
    { status: 201, headers: { "Set-Cookie": sessionCookieHeader(token) } }
  );
};

export const config = { path: "/api/auth/register" };
