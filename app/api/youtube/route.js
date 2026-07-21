import { getVideoDetails, getSubtitles } from "youtube-caption-extractor";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

// The generate route only feeds ~16k chars to the model; a small buffer keeps
// its own "truncated" notice honest without shipping huge payloads around.
const MAX_TRANSCRIPT_CHARS = 24000;

function getIp(req) {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

// Accepts watch?v=, youtu.be/, shorts/, embed/, live/ URLs and bare 11-char IDs.
function extractVideoId(input) {
  const s = (input || "").trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

function joinCues(subtitles) {
  if (!Array.isArray(subtitles)) return "";
  return subtitles
    .map((c) => (c && typeof c.text === "string" ? c.text : ""))
    .join(" ")
    .replace(/&amp;#39;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req) {
  // Per-IP limit — transcript scraping is a public, unauthenticated fetch.
  const limit = rateLimit(`youtube:${getIp(req)}`, { max: 6, windowMs: 60000 });
  if (!limit.ok) {
    return Response.json(
      { error: "Too many videos at once. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const videoID = extractVideoId(typeof body.url === "string" ? body.url : "");
  if (!videoID) {
    return Response.json(
      { error: "That doesn't look like a YouTube link. Paste the full video URL." },
      { status: 400 }
    );
  }

  const NO_CAPTIONS_MSG =
    "Couldn't get captions for this video — they may be turned off, or YouTube may be blocking our server. Tip: open the video → ⋯ → Show transcript, copy it, and paste it in the Text tab.";

  try {
    // English first (also returns the title); fall back to whatever caption
    // track exists (auto-generated / other languages).
    let title = "";
    let text = "";
    try {
      const details = await getVideoDetails({ videoID, lang: "en" });
      title = details?.title || "";
      text = joinCues(details?.subtitles);
    } catch {}
    if (!text) {
      try {
        text = joinCues(await getSubtitles({ videoID }));
      } catch {}
    }

    if (!text) {
      return Response.json({ error: NO_CAPTIONS_MSG }, { status: 422 });
    }

    text = text.slice(0, MAX_TRANSCRIPT_CHARS);
    return Response.json({
      title: String(title).slice(0, 200),
      text,
      chars: text.length,
    });
  } catch {
    return Response.json({ error: NO_CAPTIONS_MSG }, { status: 422 });
  }
}
