import Groq from "groq-sdk";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

// Groq's multimodal model — reads photos of notes, classifies + transcribes.
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

// ~4 MB of base64 ≈ a 3 MB JPEG. Phone captures are recompressed client-side
// before upload, so anything bigger than this is not a legit capture.
const MAX_B64_BYTES = 4 * 1024 * 1024;

function getIp(req) {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

const SYSTEM = `You are the intake filter for NotesGPT, a study tool. The user photographed something claiming it is study material (lecture notes, a textbook page, a whiteboard, slides, handwritten notes, formulas, diagrams with labels).

Look at the image and respond with ONE JSON object, nothing else:
{
  "legit": true/false,        // is this actually readable study material?
  "confidence": 0-100,
  "kind": "handwritten notes|textbook page|whiteboard|slides|screenshot|other",
  "reason": "one short sentence for the user, friendly tone",
  "text": "ALL readable text transcribed faithfully, preserving structure with line breaks. Empty string if not legit."
}

NOT legit: selfies, memes, pets, food, random objects, blank pages, blurry unreadable shots, or images with under ~15 words of readable content. When unreadable, say so kindly and suggest retaking with better light.`;

export async function POST(req) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "Missing GROQ_API_KEY." }, { status: 500 });
  }

  const limit = rateLimit(`vision:${getIp(req)}`, { max: 6, windowMs: 60000 });
  if (!limit.ok) {
    return Response.json(
      { error: "Too many photos. Please wait a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const image = typeof body.image === "string" ? body.image : "";
  if (!image.startsWith("data:image/")) {
    return Response.json({ error: "No image received." }, { status: 400 });
  }
  if (image.length > MAX_B64_BYTES) {
    return Response.json({ error: "Photo is too large — please retake it." }, { status: 413 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      model: VISION_MODEL,
      temperature: 0.2,
      max_tokens: 2200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SYSTEM },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return Response.json({ error: "Could not read the photo. Try again." }, { status: 502 });
    }

    return Response.json({
      legit: !!data.legit,
      confidence: Math.min(100, Math.max(0, Number(data.confidence) || 0)),
      kind: String(data.kind || "other").slice(0, 40),
      reason: String(data.reason || "").slice(0, 200),
      text: String(data.text || "").slice(0, 20000),
    });
  } catch (e) {
    const status = e?.status === 429 ? 429 : 500;
    return Response.json(
      {
        error:
          status === 429
            ? "Groq's free rate limit was hit. Wait a minute and try again."
            : "Could not analyse the photo. Please try again.",
      },
      { status }
    );
  }
}
