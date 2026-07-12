import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";

// Jedes Chunk bleibt klar unter dem Payload-Limit von Serverless Functions,
// dadurch können insgesamt viel größere Videos hochgeladen werden.
const MAX_CHUNK_BYTES = 4.5 * 1024 * 1024;

export default async (req) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Ungültiger Request-Body");
  }

  const { id, index, chunkBase64 } = body || {};

  if (!id || typeof id !== "string") return errorResponse("Fehlende Upload-ID");
  if (!Number.isInteger(index) || index < 0) return errorResponse("Ungültiger Chunk-Index");
  if (!chunkBase64) return errorResponse("Kein Chunk-Inhalt übermittelt");

  let buffer;
  try {
    buffer = Buffer.from(chunkBase64, "base64");
  } catch {
    return errorResponse("Chunk konnte nicht gelesen werden");
  }

  if (buffer.byteLength === 0) return errorResponse("Chunk ist leer");
  if (buffer.byteLength > MAX_CHUNK_BYTES) {
    return errorResponse("Chunk ist zu groß", 413);
  }

  const chunkStore = getStore("video-chunks");
  await chunkStore.set(`${id}:${index}`, buffer);

  return json({ ok: true });
};

export const config = { path: "/api/upload-chunk" };
