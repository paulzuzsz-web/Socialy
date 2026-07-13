import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";
import { getSessionUserRecord, getUserRecord, saveUserRecord, publicUser } from "./auth-utils.js";

export default async (req, context) => {
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const session = await getSessionUserRecord(req);
  if (!session) return errorResponse("Bitte melde dich an.", 401);

  const channelUsername = context.params.username;
  if (!channelUsername) return errorResponse("Fehlender Kanalname", 400);
  const channelKey = channelUsername.toLowerCase();

  if (channelKey === session.key) {
    return errorResponse("Du kannst dich nicht selbst abonnieren", 400);
  }

  const channel = await getUserRecord(channelKey);
  if (!channel) return errorResponse("Kanal nicht gefunden", 404);

  const edgeStore = getStore("subscriptions");
  const edgeKey = `${session.key}:${channelKey}`;
  const existing = await edgeStore.get(edgeKey);

  let subscribed;
  if (existing) {
    await edgeStore.delete(edgeKey);
    channel.subscriberCount = Math.max(0, (channel.subscriberCount || 0) - 1);
    subscribed = false;
  } else {
    await edgeStore.set(edgeKey, "1");
    channel.subscriberCount = (channel.subscriberCount || 0) + 1;
    subscribed = true;
  }
  await saveUserRecord(channelKey, channel);

  return json({ ok: true, subscribed, channel: publicUser(channel) });
};

export const config = { path: "/api/subscribe/:username" };
