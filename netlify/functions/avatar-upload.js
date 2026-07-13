import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";
import { getSessionUserRecord, saveUserRecord } from "./auth-utils.js";

const MAX_BYTES = 2 * 1024 * 1024;

export default async (req) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const session = await getSessionUserRecord(req);
  if (!session) return errorResponse("Bitte melde dich an.", 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Ungültiger Request-Body");
  }

  const { imageBase64, contentType } = body || {};
  if (!imageBase64) return errorResponse("Kein Bild übermittelt");

  const raw = imageBase64.includes(",") ? imageBase64.split(",").pop() : imageBase64;
  let buffer;
  try {
    buffer = Buffer.from(raw, "base64");
  } catch {
    return errorResponse("Ungültiges Bildformat");
  }
  if (buffer.byteLength === 0) return errorResponse("Ungültiges Bildformat");
  if (buffer.byteLength > MAX_BYTES) {
    return errorResponse(`Bild ist zu groß (max. ${(MAX_BYTES / 1024 / 1024).toFixed(0)} MB).`, 413);
  }

  const avatarStore = getStore("avatars");
  await avatarStore.set(session.key, buffer, {
    metadata: { contentType: contentType && contentType.startsWith("image/") ? contentType : "image/jpeg" },
  });

  const user = session.user;
  user.avatarVersion = (user.avatarVersion || 0) + 1;
  await saveUserRecord(session.key, user);

  return json({ ok: true, avatarVersion: user.avatarVersion });
};

export const config = { path: "/api/avatar-upload" };
