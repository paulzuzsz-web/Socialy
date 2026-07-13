import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";
import { getSessionUser } from "./auth-utils.js";

// Each chunk stays safely under the payload limit for serverless functions,
// which lets much larger videos be uploaded overall. Sent as a raw binary
// body (not base64-wrapped JSON) to avoid encoding overhead and the ~33%
// size inflation base64 would add.
const MAX_CHUNK_BYTES = 6 * 1024 * 1024;

export default async (req) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return errorResponse("Bitte melde dich an.", 401);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const index = Number(url.searchParams.get("index"));

  if (!id) return errorResponse("Fehlende Upload-ID");
  if (!Number.isInteger(index) || index < 0) return errorResponse("Ungültiger Chunk-Index");

  const buffer = Buffer.from(await req.arrayBuffer());

  if (buffer.byteLength === 0) return errorResponse("Chunk ist leer");
  if (buffer.byteLength > MAX_CHUNK_BYTES) {
    return errorResponse("Chunk ist zu groß", 413);
  }

  const chunkStore = getStore("video-chunks");
  await chunkStore.set(`${id}:${index}`, buffer);

  return json({ ok: true });
};

export const config = { path: "/api/upload-chunk" };
