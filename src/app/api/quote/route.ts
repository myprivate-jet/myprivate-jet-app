import { NextResponse } from "next/server";
import { quoteFor, tripSchema } from "@/lib/pricing/quote";

/** One recommendation and one final price. No ranges, no operator data. */
export async function POST(req: Request) {
  const parsed = tripSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the trip details." }, { status: 400 });
  const q = quoteFor(parsed.data);
  if (!q) return NextResponse.json({ error: "Choose both airports from the list." }, { status: 400 });
  return NextResponse.json(q, { headers: { "Cache-Control": "no-store" } });
}
