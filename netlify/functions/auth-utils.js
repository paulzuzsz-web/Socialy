import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const SESSION_COOKIE = "socialy_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 Tage

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

export function sessionCookieHeader(token, maxAge = SESSION_MAX_AGE) {
  return [`${SESSION_COOKIE}=${token}`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax", `Max-Age=${maxAge}`].join(
    "; "
  );
}

export function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function createSession(usernameKey) {
  const token = crypto.randomBytes(32).toString("hex");
  const store = getStore("sessions");
  await store.setJSON(token, { username: usernameKey, createdAt: new Date().toISOString() });
  return token;
}

export async function getSessionUser(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;

  const sessionStore = getStore("sessions");
  const session = await sessionStore.get(token, { type: "json" });
  if (!session) return null;

  const usersStore = getStore("users");
  const user = await usersStore.get(session.username, { type: "json" });
  if (!user) return null;

  return { username: user.username, createdAt: user.createdAt };
}

export async function deleteSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return;
  const store = getStore("sessions");
  await store.delete(token);
}
