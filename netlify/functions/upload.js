import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";

// Serverless Functions haben ein begrenztes Request-Limit (~6 MB).
// Wir erlauben daher max. 4 MB Rohdatengröße pro Video (Base64 legt ~33% drauf).
const MAX_VIDEO_BYTES = 4 * 1024 * 1024;

export default async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Ungültiger Request-Body");
  }

  const {
    title,
    description = "",
    username,
    videoBase64,
    videoType,
    thumbnailBase64,
  } = body || {};

  if (!title || !title.trim()) return errorResponse("Titel fehlt");
  if (!username || !username.trim()) return errorResponse("Benutzername fehlt");
  if (!videoBase64) return errorResponse("Kein Video übermittelt");

  let videoBuffer;
  try {
    videoBuffer = Buffer.from(videoBase64, "base64");
  } catch {
    return errorResponse("Video konnte nicht gelesen werden");
  }

  if (videoBuffer.byteLength === 0) {
    return errorResponse("Video ist leer");
  }

  if (videoBuffer.byteLength > MAX_VIDEO_BYTES) {
    return errorResponse(
      `Video ist zu groß (max. ${(MAX_VIDEO_BYTES / 1024 / 1024).toFixed(1)} MB). Bitte ein kürzeres oder stärker komprimiertes Video hochladen.`,
      413
    );
  }

  const id = crypto.randomUUID();

  const videoStore = getStore("video-files");
  await videoStore.set(id, videoBuffer, {
    metadata: { contentType: videoType || "video/mp4" },
  });

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
    username: username.trim().slice(0, 40),
    createdAt: new Date().toISOString(),
    views: 0,
    likes: 0,
    comments: [],
    hasThumbnail,
  };
  await metaStore.setJSON(id, meta);

  return json({ ok: true, id, video: meta }, { status: 201 });
};

export const config = { path: "/api/upload" };
