import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";
import { getSessionUser } from "./auth-utils.js";

export default async (req, context) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return errorResponse("Bitte melde dich an.", 401);

  const id = context.params.id;
  const store = getStore("videos-meta");
  const meta = await store.get(id, { type: "json" });
  if (!meta) return errorResponse("Video nicht gefunden", 404);

  meta.likedBy = Array.isArray(meta.likedBy) ? meta.likedBy : [];
  const key = sessionUser.username.toLowerCase();

  if (meta.likedBy.includes(key)) {
    return json({ likes: meta.likes || 0, alreadyLiked: true });
  }

  meta.likedBy.push(key);
  meta.likes = (meta.likes || 0) + 1;
  await store.setJSON(id, meta);

  return json({ likes: meta.likes });
};

export const config = { path: "/api/like/:id" };
