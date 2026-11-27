"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/server/db";
import { clearPending, currentMember, endSession, getPending, setPending, startMemberSession } from "@/server/auth/session";
import { smsVerifier } from "@/server/integrations/sms";
import { createCardCheckout } from "@/server/integrations/payments";
import { simulationsAllowed } from "@/server/integrations/config";
import { TERMS_VERSION } from "@/lib/booking/terms";
import { PROFILE_KEYS } from "@/lib/booking/profile";
import { addDays, todayISO } from "@/lib/format";
import { quoteFor, tripSchema, type TripRequest } from "@/lib/pricing/quote";
import { CONFIRM_HOURS } from "@/lib/pricing/engine";
import { audit } from "@/server/queries";
import { sampleOffers } from "@/server/sample";
import { markClientPaid } from "@/server/ops";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const { members, profiles, verifications, bookings, passengers, payments, chatMessages, offers, operatorMessages } = schema;

const joinSchema = z.object({
  first: z.string().trim().min(1, "Please give your first and family name.").max(80),
  last: z.string().trim().min(1, "Please give your first and family name.").max(80),
  email: z.string().trim().email("Please check your email address.").max(200),
  cc: z.string().regex(/^\+\d{1,4}$/),
  phone: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().min(6, "Please check your mobile number.").max(14, "Please check your mobile number.")),
  terms: z.literal("on", { message: "Please accept the Membership Terms to continue." }),
});

const mask = (e164: string) => `${e164.slice(0, e164.length - 9 > 0 ? e164.length - 9 : 3)} ••• ${e164.slice(-3)}`;

/** Step 1: details and one tick. Sends the SMS code. */
export async function startMembership(_: unknown, form: FormData): Promise<Result<{ masked: string; simulated: boolean }>> {
  const parsed = joinSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { first, last, email, cc, phone } = parsed.data;
  const e164 = cc + phone.replace(/^0+/, "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // Rate limit: 5 codes per number per hour.
  const [{ n }] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(verifications)
    .where(and(eq(verifications.phone, e164), gt(verifications.createdAt, new Date(Date.now() - 36e5))));
  if (n >= 5) return { ok: false, error: "Too many codes requested. Please try again in an hour, or chat with us." };

  const sms = smsVerifier();
  try {
    await sms.start(e164);
  } catch {
    return { ok: false, error: "We could not send a code to this number. Please check it." };
  }
  await db().insert(verifications).values({ phone: e164, ip, status: "sent" });
  await setPending({ first, last, email, phone: e164, termsVersion: TERMS_VERSION, acceptedAt: new Date().toISOString() });
  return { ok: true, masked: mask(e164), simulated: sms.simulated };
}

/** Step 2: the 6-digit code. Creates (or signs back in) the member and records the mandate. */
export async function confirmMembership(_: unknown, form: FormData): Promise<Result> {
  const code = String(form.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "The code has 6 digits." };
  const p = await getPending();
  if (!p) return { ok: false, error: "This code has expired. Please start again." };
  const okCode = await smsVerifier().check(p.phone, code);
  await db().insert(verifications).values({ phone: p.phone, status: okCode ? "approved" : "failed" });
  if (!okCode) return { ok: false, error: "That code is not right. Please check the SMS." };

  const h = await headers();
  const [existing] = await db().select().from(members).where(eq(members.phone, p.phone)).limit(1);
  let memberId: string;
  if (existing) {
    memberId = existing.id;
    await db().update(members).set({ firstName: p.first, lastName: p.last, email: p.email }).where(eq(members.id, memberId));
  } else {
    const [m] = await db()
      .insert(members)
      .values({
        firstName: p.first, lastName: p.last, email: p.email, phone: p.phone,
        termsVersion: p.termsVersion, mandateAcceptedAt: new Date(p.acceptedAt),
        mandateIp: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null, mandateUserAgent: h.get("user-agent")?.slice(0, 300) ?? null,
      })
      .returning({ id: members.id });
    memberId = m.id;
    await db().insert(profiles).values({ memberId, data: { first: p.first, last: p.last, email: p.email } });
    await audit("member", "membership.created", { memberId }, { termsVersion: p.termsVersion, mandate: true });
  }
  await clearPending();
  await startMemberSession(memberId);
  return { ok: true };
}

export async function signOut() {
  await endSession("member");
  revalidatePath("/", "layout");
}

async function requireMember() {
  const m = await currentMember();
  if (!m) throw new Error("Please verify your mobile first.");
  return m;
}

const newRef = () => "MPJ-" + (1000 + Math.floor(Math.random() * 9000)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));

/** "Book this flight". The price is recomputed here; the browser's figure is never trusted. */
export async function bookFlight(req: TripRequest): Promise<Result<{ ref: string }>> {
  const m = await requireMember();
  const parsed = tripSchema.safeParse(req);
  if (!parsed.success) return { ok: false, error: "Please check the trip details." };
  const q = quoteFor(parsed.data, m.tier);
  if (!q) return { ok: false, error: "Please choose both airports." };
  const std = q.shown ?? q.advisorStandard ?? "large";
  const computed = q.shown ? q.standards[q.shown].price : null;
  // No one waits (Pascal, 2026-11-27): every member's price on screen is firm and booking accepts it.
  // Only a standard the model cannot price automatically still goes to the advisor for one final price.
  const assured = computed != null;
  const priced = assured ? computed : null;
  const payBy = addDays(q.trip.date, -5) < todayISO() ? todayISO() : addDays(q.trip.date, -5);
  const ref = newRef();
  const [b] = await db()
    .insert(bookings)
    .values({
      ref, memberId: m.id, fromIcao: q.trip.from, toIcao: q.trip.to, date: q.trip.date, time: q.trip.time,
      returnDate: q.trip.ret ? q.trip.rdate || null : null, pax: q.trip.pax, luggage: parsed.data.bags,
      standUp: parsed.data.standUp, attendant: parsed.data.attendant, pets: parsed.data.pets,
      standard: std, price: priced, estimate: assured ? null : computed, currency: q.trip.cur, guarantee: q.guarantee,
      priceAcceptedAt: assured ? new Date() : null,
      priceValidUntil: new Date(Date.now() + 24 * 36e5), payBy,
      stage: assured ? 4 : 0,
      needsAdvisor: assured ? "Choose the aircraft" : "Send the final price",
      sla: `Within ${CONFIRM_HOURS} h of the request`,
      flags: [
        q.guarantee === "instant" ? "Assured member: price and aircraft guaranteed" : priced != null ? "Firm price accepted; aircraft subject to availability" : "Advisor to price this standard",
        q.event ? `Peak: ${q.event}` : null,
        q.tier === "assured" && q.guarantee === "firm" ? `Inside ${q.notice} h notice: aircraft not guaranteed` : null,
        parsed.data.bags !== "std" ? `Luggage: ${parsed.data.bags}` : null,
        parsed.data.pets ? "Pets in cabin" : null,
      ].filter(Boolean) as string[],
    })
    .returning();
  await db().insert(passengers).values(Array.from({ length: b.pax }, (_, i) => ({ bookingId: b.id, seat: i + 1, fullName: i === 0 ? `${m.firstName} ${m.lastName}` : null })));
  await db().insert(operatorMessages).values({
    bookingId: b.id, direction: "out", fromName: "MyPrivate-Jet Ops", toName: "Qualified operators", label: "Booked + 2 min",
    subject: `RFQ ${ref} · ${b.fromIcao}–${b.toIcao} · ${b.date} · ${b.pax} pax`,
    body: `Request for quote. ${b.fromIcao}–${b.toIcao}, ${b.date} ${b.time} local, ${b.pax} passengers. Audited operators only${m.tier === "assured" ? ", aircraft built in the last 7 years or refurbished in the last 2" : ", any suitable aircraft"}. Price ceiling applies.`,
    aiNote: "Prepared automatically. Operator email is not connected yet, so nothing was sent.", status: "queued",
  });
  // Until operator RFQs are connected, sample offers keep the advisor flow testable.
  await addSampleOffers(b, priced ?? computed);
  await audit("member", "booking.created", { bookingId: b.id, memberId: m.id }, { tier: q.tier, price: priced, estimate: assured ? null : computed, currency: b.currency, standard: std, mandate: "instructed under membership mandate" });
  revalidatePath("/office");
  return { ok: true, ref };
}

async function addSampleOffers(b: typeof bookings.$inferSelect, ceiling: number | null) {
  if (ceiling == null || !simulationsAllowed()) return;
  const rows = sampleOffers(b);
  await db().insert(offers).values(rows.map((o) => ({ ...o, bookingId: b.id })));
  if (b.priceAcceptedAt && !rows.some((o) => o.audited && o.cost <= ceiling)) {
    await db().update(bookings).set({ exception: true, needsAdvisor: "No offer at or below our price" }).where(eq(bookings.id, b.id));
  }
}

/** Private members: accept the advisor's final price with one tap. From here the price is fixed. */
export async function acceptPrice(ref: string): Promise<Result> {
  const m = await requireMember();
  const b = await ownBooking(ref, m.id);
  if (b.price == null || b.priceAcceptedAt) return { ok: false, error: "There is no new price to accept." };
  if (b.priceValidUntil && b.priceValidUntil < new Date()) return { ok: false, error: "This price has expired. Your advisor will send a fresh one." };
  const [o] = await db().select({ id: offers.id }).from(offers).where(eq(offers.bookingId, b.id)).limit(1);
  const [u] = await db().update(bookings).set({ priceAcceptedAt: new Date(), stage: 4, needsAdvisor: "Choose the aircraft", sla: `Within ${CONFIRM_HOURS} h of acceptance`, waitingOn: null, updatedAt: new Date() }).where(eq(bookings.id, b.id)).returning();
  if (!o) await addSampleOffers(u, u.price);
  await audit("member", "price.accepted", { bookingId: b.id, memberId: m.id }, { price: b.price, currency: b.currency, mandate: "instructed under membership mandate" });
  revalidatePath("/office");
  return { ok: true };
}

/** Private members: decline the final price. Nothing is owed. */
export async function declinePrice(ref: string): Promise<Result> {
  const m = await requireMember();
  const b = await ownBooking(ref, m.id);
  if (b.price == null || b.priceAcceptedAt) return { ok: false, error: "There is no new price to decline." };
  await db().update(bookings).set({ needsAdvisor: "Client declined the final price", waitingOn: null, updatedAt: new Date() }).where(eq(bookings.id, b.id));
  await audit("member", "price.declined", { bookingId: b.id, memberId: m.id }, { price: b.price });
  revalidatePath("/office");
  return { ok: true };
}

/** Ask to become an Assured member. The advisor confirms the fee and activates it. */
export async function requestAssured(): Promise<Result> {
  const m = await requireMember();
  if (m.tier === "assured") return { ok: true };
  if (!m.assuredRequestedAt) {
    await db().update(members).set({ assuredRequestedAt: new Date() }).where(eq(members.id, m.id));
    await db().insert(chatMessages).values({ memberId: m.id, author: "member", body: "I would like to become an Assured member.", context: "Membership: request for Assured" });
    await audit("member", "assured.requested", { memberId: m.id });
  }
  revalidatePath("/office");
  return { ok: true };
}

async function ownBooking(ref: string, memberId: string) {
  const [b] = await db().select().from(bookings).where(and(eq(bookings.ref, ref), eq(bookings.memberId, memberId))).limit(1);
  if (!b) throw new Error("Booking not found.");
  return b;
}

/** "Pay now". Card through Stripe (or simulated); bank transfer marks the invoice as sent. */
export async function payBooking(ref: string, method: "bank" | "card"): Promise<Result<{ url?: string; note?: string }>> {
  const m = await requireMember();
  const b = await ownBooking(ref, m.id);
  if (b.stage !== 6 || b.price == null) return { ok: false, error: "Payment opens once your aircraft is confirmed." };
  if (method === "bank") {
    await db().insert(payments).values({ bookingId: b.id, direction: "in", amount: b.price, currency: b.currency, status: "requested", method: "bank" });
    await db().update(bookings).set({ waitingOn: "Bank transfer expected · reconciled from the bank feed" }).where(eq(bookings.id, b.id));
    return { ok: true, note: `Our account details and your reference ${ref} are on the invoice in your documents.` };
  }
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const co = await createCardCheckout({ ref, amount: b.price, currency: b.currency, email: m.email, returnUrl: `${origin}/office` });
  if (co.url) return { ok: true, url: co.url };
  // Simulated card payment (development only).
  await markClientPaid(b.id, b.price, b.currency, "card (simulated)");
  revalidatePath("/office");
  return { ok: true, note: "Received. Thank you. (Simulated: no card was charged.)" };
}

/** Passenger names and passports. Passport images are read in the browser and never uploaded yet. */
export async function savePassengers(ref: string, names: string[], passports: boolean[], keep: boolean): Promise<Result> {
  const m = await requireMember();
  const b = await ownBooking(ref, m.id);
  for (let i = 0; i < b.pax; i++) {
    const fullName = (names[i] ?? "").trim().slice(0, 120) || null;
    const read = Boolean(passports[i]);
    await db()
      .insert(passengers)
      .values({ bookingId: b.id, seat: i + 1, fullName, passportStatus: read ? "read" : "none", passportReadAt: read ? new Date() : null })
      .onConflictDoUpdate({ target: [passengers.bookingId, passengers.seat], set: { fullName, passportStatus: read ? "read" : "none", passportReadAt: read ? new Date() : null } });
  }
  await db().update(bookings).set({ keepPassports: keep, updatedAt: new Date() }).where(eq(bookings.id, b.id));
  revalidatePath("/office");
  return { ok: true };
}

export async function saveProfile(data: Record<string, string | boolean>): Promise<Result> {
  const m = await requireMember();
  const clean = Object.fromEntries(
    Object.entries(data).filter(([k]) => PROFILE_KEYS.has(k)).map(([k, v]) => [k, typeof v === "boolean" ? v : String(v).slice(0, 1000)]),
  );
  await db()
    .insert(profiles)
    .values({ memberId: m.id, data: clean })
    .onConflictDoUpdate({ target: profiles.memberId, set: { data: sql`${profiles.data} || ${JSON.stringify(clean)}::jsonb`, updatedAt: new Date() } });
  return { ok: true };
}

export async function sendChat(body: string, context?: string): Promise<Result> {
  const m = await requireMember();
  const text = body.trim().slice(0, 4000);
  if (!text) return { ok: false, error: "Empty message." };
  await db().insert(chatMessages).values({ memberId: m.id, author: "member", body: text, context: context?.slice(0, 300) });
  return { ok: true };
}

export async function loadChat() {
  const m = await currentMember();
  if (!m) return [];
  const rows = await db().select().from(chatMessages).where(eq(chatMessages.memberId, m.id)).orderBy(chatMessages.createdAt).limit(200);
  return rows.map((r) => ({ id: r.id, author: r.author, body: r.body, at: r.createdAt.toISOString() }));
}
