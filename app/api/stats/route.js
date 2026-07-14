import { getStats } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Live usage numbers for the homepage trust dashboard.
export async function GET() {
  return Response.json(getStats(), {
    headers: { "Cache-Control": "no-store" },
  });
}
