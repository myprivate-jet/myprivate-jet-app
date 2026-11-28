import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { markClientPaid } from "@/server/ops";

/** Stripe confirms card payments here (checkout.session.completed). Signature checked against STRIPE_WEBHOOK_SECRET. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const parts = Object.fromEntries(sig.split(",").map((p) => p.split("=") as [string, string]));
  const expected = createHmac("sha256", secret).update(`${parts.t}.${body}`).digest("hex");
  const ok = parts.v1 && parts.v1.length === expected.length && timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
  if (!ok || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  const event = JSON.parse(body) as { type: string; data: { object: { metadata?: { booking_ref?: string }; amount_total?: number; currency?: string; payment_status?: string } } };
  if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
    const ref = event.data.object.metadata?.booking_ref;
    if (ref) {
      const [b] = await db().select().from(schema.bookings).where(eq(schema.bookings.ref, ref)).limit(1);
      if (b && b.stage === 6) await markClientPaid(b.id, Math.round((event.data.object.amount_total ?? 0) / 100), (event.data.object.currency ?? b.currency).toUpperCase(), "card (Stripe)");
    }
  }
  return NextResponse.json({ received: true });
}
