import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";
import { getSessionUser } from "./auth-utils.js";

export default async (req, context) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return errorResponse("Bitte melde dich an.", 401);

  const id = context.params.id;

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Ungültiger Request-Body");
  }

  const text = (body.text || "").trim().slice(0, 500);
  if (!text) return errorResponse("Kommentar ist leer");

  const store = getStore("videos-meta");
  const meta = await store.get(id, { type: "json" });
  if (!meta) return errorResponse("Video nicht gefunden", 404);

  const comment = {
    id: crypto.randomUUID(),
    author: sessionUser.username,
    text,
    createdAt: new Date().toISOString(),
  };
  meta.comments = Array.isArray(meta.comments) ? meta.comments : [];
  meta.comments.push(comment);
  await store.setJSON(id, meta);

  return json({ comments: meta.comments }, { status: 201 });
};

export const config = { path: "/api/comment/:id" };
