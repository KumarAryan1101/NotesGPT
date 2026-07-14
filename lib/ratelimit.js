// Simple in-memory per-IP rate limiter (sliding window).
//
// Good enough for a student project on a single/low-traffic deployment.
// NOTE: Vercel runs multiple serverless instances, so this counter is
// per-instance and resets on cold starts. For real production protection,
// swap this for Upstash Redis (@upstash/ratelimit) — free tier, works across
// instances. The API shape below stays the same.

const hits = new Map(); // ip -> number[] (timestamps in ms)

export function rateLimit(ip, { max = 8, windowMs = 60000 } = {}) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);

  // Occasional garbage-collection so the map doesn't grow forever.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    }
  }

  return {
    ok: recent.length <= max,
    remaining: Math.max(0, max - recent.length),
    retryAfter: Math.ceil(windowMs / 1000),
  };
}
