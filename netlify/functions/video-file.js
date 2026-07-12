import { getStore } from "@netlify/blobs";
import { errorResponse } from "./utils.js";

export default async (req, context) => {
  const id = context.params.id;
  if (!id) return errorResponse("Fehlende ID", 400);

  const store = getStore("video-files");
  const result = await store.getWithMetadata(id, { type: "arrayBuffer" });

  if (!result) return errorResponse("Video nicht gefunden", 404);

  const contentType = result.metadata?.contentType || "video/mp4";

  return new Response(result.data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
    },
  });
};

export const config = { path: "/api/video/:id" };
