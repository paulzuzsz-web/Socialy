// Best-effort automated content check: since Socialy is rated 12+, every
// upload's thumbnail frame is screened for graphic violence or sexual/
// explicit content before the video is published. This only inspects the
// single thumbnail frame (not the full video), and only runs at all if an
// ANTHROPIC_API_KEY is configured on the deployment — without a key the
// check is skipped (fail-open) so uploads still work, but moderation is not
// actually enforced. Configure the key in production to enable it for real.
const MODEL = process.env.MODERATION_MODEL || "claude-haiku-4-5-20251001";

export async function moderateThumbnail(base64Jpeg) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !base64Jpeg) {
    return { checked: false, safe: true };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: base64Jpeg },
              },
              {
                type: "text",
                text:
                  "You are the automated content-safety filter for Socialy, a video-sharing platform rated for ages 12 and up. This image is the thumbnail of an uploaded video. Reply with exactly one word, nothing else: SAFE if the image shows no graphic violence, gore, weapons used against people, sexual content, or nudity; UNSAFE if it shows any of those.",
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Moderation API error", res.status, await res.text().catch(() => ""));
      return { checked: false, safe: true };
    }

    const data = await res.json();
    const text = (data?.content?.find((c) => c.type === "text")?.text || "").trim().toUpperCase();
    return { checked: true, safe: !text.startsWith("UNSAFE") };
  } catch (err) {
    console.error("Moderation check failed", err);
    return { checked: false, safe: true };
  }
}
