import { getStore } from "@netlify/blobs";
import { errorResponse } from "./utils.js";

export default async (req, context) => {
  const id = context.params.id;
  if (!id) return errorResponse("Fehlende ID", 400);

  const store = getStore("thumbnails");
  const result = await store.getWithMetadata(id, { type: "arrayBuffer" });

  if (!result) return errorResponse("Kein Thumbnail vorhanden", 404);

  return new Response(result.data, {
    status: 200,
    headers: {
      "Content-Type": result.metadata?.contentType || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

export const config = { path: "/api/thumbnail/:id" };
