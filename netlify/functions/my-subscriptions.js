import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";
import { getSessionUserRecord } from "./auth-utils.js";

export default async (req) => {
  const session = await getSessionUserRecord(req);
  if (!session) return errorResponse("Bitte melde dich an.", 401);

  const edgeStore = getStore("subscriptions");
  const prefix = `${session.key}:`;
  const { blobs } = await edgeStore.list({ prefix });
  const channels = blobs
    .map((b) => b.key)
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length));

  return json({ channels });
};

export const config = { path: "/api/subscriptions" };
