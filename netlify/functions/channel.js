import { getStore } from "@netlify/blobs";
import { json, errorResponse } from "./utils.js";
import { getUserRecord, getSessionUserRecord, publicUser } from "./auth-utils.js";

export default async (req, context) => {
  const username = context.params.username;
  if (!username) return errorResponse("Fehlender Kanalname", 400);
  const channelKey = username.toLowerCase();

  const channel = await getUserRecord(channelKey);
  if (!channel) return errorResponse("Kanal nicht gefunden", 404);

  const session = await getSessionUserRecord(req);
  let isSubscribed = false;
  let isSelf = false;
  if (session) {
    isSelf = session.key === channelKey;
    if (!isSelf) {
      const edgeStore = getStore("subscriptions");
      isSubscribed = !!(await edgeStore.get(`${session.key}:${channelKey}`));
    }
  }

  return json({ channel: publicUser(channel), isSubscribed, isSelf });
};

export const config = { path: "/api/channel/:username" };
