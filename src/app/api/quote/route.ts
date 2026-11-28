import { NextResponse } from "next/server";
import { quoteFor, tripSchema } from "@/lib/pricing/quote";
import { currentMember } from "@/server/auth/session";

/** One recommendation and one price: firm for everyone; for Assured, the aircraft is guaranteed too. No ranges, no operator data. */
export async function POST(req: Request) {
  const parsed = tripSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the trip details." }, { status: 400 });
  const m = await currentMember();
  const q = quoteFor(parsed.data, m?.tier ?? "guest");
  if (!q) return NextResponse.json({ error: "Choose both airports from the list." }, { status: 400 });
  return NextResponse.json(q, { headers: { "Cache-Control": "no-store" } });
}
