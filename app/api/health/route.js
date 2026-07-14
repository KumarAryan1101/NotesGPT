export const runtime = "nodejs";

// Liveness probe only. Intentionally does NOT reveal whether a key is set or
// which model is configured — that's internal info a public endpoint
// shouldn't advertise. Check server logs/env if you need to verify the key.
export async function GET() {
  return Response.json({ ok: true });
}
