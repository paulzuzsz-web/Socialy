import { getStore } from "@netlify/blobs";
import { json } from "./utils.js";

export default async () => {
  const metaStore = getStore("videos-meta");
  const { blobs } = await metaStore.list();

  const videos = (
    await Promise.all(
      blobs.map(async (b) => {
        try {
          return await metaStore.get(b.key, { type: "json" });
        } catch {
          return null;
        }
      })
    )
  ).filter(Boolean);

  videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return json({ videos });
};

export const config = { path: "/api/videos" };
