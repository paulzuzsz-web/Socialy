import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";
import { getSessionUser } from "./auth-utils.js";

// Gesamtgröße nach dem Zusammenfügen aller Chunks.
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export default async (req) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return errorResponse("Bitte melde dich an.", 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Ungültiger Request-Body");
  }

  const { id, totalChunks, title, description = "", videoType, thumbnailBase64 } = body || {};

  if (!id || typeof id !== "string") return errorResponse("Fehlende Upload-ID");
  if (!Number.isInteger(totalChunks) || totalChunks < 1) {
    return errorResponse("Ungültige Chunk-Anzahl");
  }
  if (!title || !title.trim()) return errorResponse("Titel fehlt");

  const chunkStore = getStore("video-chunks");
  const parts = [];
  let totalBytes = 0;

  for (let i = 0; i < totalChunks; i++) {
    const key = `${id}:${i}`;
    const chunk = await chunkStore.get(key, { type: "arrayBuffer" });
    if (!chunk) {
      return errorResponse(`Chunk ${i} fehlt – Upload unvollständig`, 400);
    }
    const buf = Buffer.from(chunk);
    totalBytes += buf.byteLength;

    if (totalBytes > MAX_TOTAL_BYTES) {
      for (let j = 0; j <= i; j++) {
        await chunkStore.delete(`${id}:${j}`).catch(() => {});
      }
      return errorResponse(
        `Video ist zu groß (max. ${(MAX_TOTAL_BYTES / 1024 / 1024).toFixed(0)} MB).`,
        413
      );
    }
    parts.push(buf);
  }

  const videoBuffer = Buffer.concat(parts);

  const videoStore = getStore("video-files");
  await videoStore.set(id, videoBuffer, {
    metadata: { contentType: videoType || "video/mp4" },
  });

  for (let i = 0; i < totalChunks; i++) {
    await chunkStore.delete(`${id}:${i}`).catch(() => {});
  }

  let hasThumbnail = false;
  if (thumbnailBase64) {
    try {
      const raw = thumbnailBase64.includes(",")
        ? thumbnailBase64.split(",").pop()
        : thumbnailBase64;
      const thumbBuffer = Buffer.from(raw, "base64");
      if (thumbBuffer.byteLength > 0) {
        const thumbStore = getStore("thumbnails");
        await thumbStore.set(id, thumbBuffer, {
          metadata: { contentType: "image/jpeg" },
        });
        hasThumbnail = true;
      }
    } catch {
      hasThumbnail = false;
    }
  }

  const metaStore = getStore("videos-meta");
  const meta = {
    id,
    title: title.trim().slice(0, 120),
    description: description.trim().slice(0, 2000),
    username: sessionUser.username,
    createdAt: new Date().toISOString(),
    views: 0,
    likes: 0,
    likedBy: [],
    comments: [],
    hasThumbnail,
  };
  await metaStore.setJSON(id, meta);

  return json({ ok: true, id, video: meta }, { status: 201 });
};

export const config = { path: "/api/upload-finalize" };
