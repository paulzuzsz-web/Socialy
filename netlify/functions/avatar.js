import { getStore } from "@netlify/blobs";
import { errorResponse } from "./utils.js";

export default async (req, context) => {
  const username = context.params.username;
  if (!username) return errorResponse("Fehlender Benutzername", 400);

  const store = getStore("avatars");
  const result = await store.getWithMetadata(username.toLowerCase(), { type: "arrayBuffer" });

  if (!result) return errorResponse("Kein Profilbild vorhanden", 404);

  return new Response(result.data, {
    status: 200,
    headers: {
      "Content-Type": result.metadata?.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=300",
    },
  });
};

export const config = { path: "/api/avatar/:username" };
