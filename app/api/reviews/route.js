import { getReviews, addReview } from "@/lib/reviews";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getIp(req) {
  const xff = req.headers.get("x-forwarded-for") || "";
  return xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

// Strip anything that could render as markup and collapse whitespace.
const clean = (s, max) =>
  String(s || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export async function GET() {
  return Response.json(
    { reviews: getReviews() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req) {
  // Tighter limit than /api/generate — nobody writes 3 reviews a minute.
  const limit = rateLimit(`review:${getIp(req)}`, { max: 3, windowMs: 60000 });
  if (!limit.ok) {
    return Response.json(
      { error: "Too many reviews. Please wait a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = clean(body.name, 40) || "Anonymous";
  const tag = clean(body.tag, 40);
  const text = clean(body.text, 400);
  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));

  if (text.length < 10) {
    return Response.json(
      { error: "Please write at least a short sentence." },
      { status: 400 }
    );
  }

  const review = addReview({ name, tag, rating, text });
  return Response.json({ review, reviews: getReviews() });
}
