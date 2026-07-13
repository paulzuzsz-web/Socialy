import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const SESSION_COOKIE = "socialy_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage

// Coin-Wirtschaft
export const SIGNUP_BONUS_COINS = 100;
export const DAILY_CLAIM_COINS = 50;
export const DAILY_CLAIM_COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 Stunden
export const PREMIUM_COST_COINS = 1000;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const testHash = crypto.scryptSync(password, salt, 64);
  return hashBuffer.length === testHash.length && crypto.timingSafeEqual(hashBuffer, testHash);
}

function parseCookies(req) {
  const header = req.headers.get("cookie") || "";
  const cookies = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

// Secure cookies are silently dropped by browsers on plain HTTP (e.g. local
// dev servers), which would otherwise make every login look like it "doesn't
// persist" on reload. Only require Secure when the request actually came in
// over HTTPS.
function isSecureRequest(req) {
  const proto = req?.headers?.get?.("x-forwarded-proto");
  if (proto) return proto === "https";
  try {
    return new URL(req.url).protocol === "https:";
  } catch {
    return true;
  }
}

export function sessionCookieHeader(token, req, maxAge = SESSION_MAX_AGE) {
  const parts = [`${SESSION_COOKIE}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (isSecureRequest(req)) parts.splice(2, 0, "Secure");
  return parts.join("; ");
}

export function clearSessionCookieHeader(req) {
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (isSecureRequest(req)) parts.splice(2, 0, "Secure");
  return parts.join("; ");
}

export async function createSession(usernameKey) {
  const token = crypto.randomBytes(32).toString("hex");
  const store = getStore("sessions");
  await store.setJSON(token, { username: usernameKey, createdAt: new Date().toISOString() });
  return token;
}

// Strips internal fields (password hash) before a user record ever reaches the client.
export function publicUser(user) {
  return {
    username: user.username,
    createdAt: user.createdAt,
    coins: user.coins || 0,
    isPremium: !!user.isPremium,
    lastDailyClaim: user.lastDailyClaim || null,
    avatarVersion: user.avatarVersion || 0,
    subscriberCount: user.subscriberCount || 0,
  };
}

export async function getUserRecord(usernameKey) {
  const usersStore = getStore("users");
  return usersStore.get(usernameKey, { type: "json" });
}

export async function saveUserRecord(usernameKey, user) {
  const usersStore = getStore("users");
  await usersStore.setJSON(usernameKey, user);
}

// Returns the raw stored session (with username key) or null.
async function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const sessionStore = getStore("sessions");
  return sessionStore.get(token, { type: "json" });
}

// Returns the public-safe current user, or null if not authenticated.
export async function getSessionUser(req) {
  const session = await getSession(req);
  if (!session) return null;
  const user = await getUserRecord(session.username);
  if (!user) return null;
  return publicUser(user);
}

// Returns { key, user } for the full (internal) user record — used when a
// function needs to mutate the record (coins, premium status, ...).
export async function getSessionUserRecord(req) {
  const session = await getSession(req);
  if (!session) return null;
  const user = await getUserRecord(session.username);
  if (!user) return null;
  return { key: session.username, user };
}

export async function deleteSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return;
  const store = getStore("sessions");
  await store.delete(token);
}
