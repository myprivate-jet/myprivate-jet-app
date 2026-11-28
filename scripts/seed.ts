/**
 * Sample data so the Office and Advisor dashboard can be tried end to end.
 * Clients are marked as demo members; operators are anonymised (Operator A–D).
 * Safe to run more than once: it replaces previous sample data only.
 */
import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";
import { hashPassword } from "../src/server/auth/session";
import { airport } from "../src/lib/pricing/airports";
import { makeTrip, price } from "../src/lib/pricing/engine";
import { sampleOffers } from "../src/server/sample";
import type { StandardId } from "../src/lib/pricing/standards";
import { TERMS_VERSION } from "../src/lib/booking/terms";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const { members, profiles, staff, bookings, offers, payments, passengers, operatorMessages, chatMessages, flightBriefs } = schema;

const email = (process.env.ADVISOR_EMAIL ?? "advisor@example.com").toLowerCase();
const password = process.env.ADVISOR_PASSWORD ?? (process.env.NODE_ENV === "production" ? "" : "change-me-now");
if (!password) throw new Error("Set ADVISOR_PASSWORD to create the first advisor account.");

await db.insert(staff).values({ email, name: "Dedicated Advisor", passwordHash: hashPassword(password), role: "admin" })
  .onConflictDoUpdate({ target: staff.email, set: { passwordHash: hashPassword(password) } });

// Remove previous sample data.
const old = await db.select({ id: members.id }).from(members).where(eq(members.isDemo, true));
if (old.length) {
  const ids = old.map((o) => o.id);
  const bk = await db.select({ id: bookings.id }).from(bookings).where(inArray(bookings.memberId, ids));
  if (bk.length) await db.delete(bookings).where(inArray(bookings.id, bk.map((b) => b.id)));
  await db.delete(members).where(inArray(members.id, ids));
}

const CLIENTS = [
  ["Claire", "Laurent", "+41790000208", { title: "Mrs", drinks: "Still water, champagne", diet: "No red meat", cater: "Fruit and light salads. No flowers in the cabin.", pet: "Milo, Cavalier King Charles", petw: "9 kg", cardep: true, cararr: true }],
  ["Richard", "Hale", "+447700900111", {}],
  ["James", "Whitmore", "+447700900222", {}],
  ["Sofia", "Kessler", "+41790000333", {}],
  ["Amir", "Rahman", "+971500000444", {}],
  ["Daniel", "Moreau", "+33600000555", {}],
] as const;
const memberIds: Record<string, string> = {};
for (const [first, last, phone, prof] of CLIENTS) {
  const [m] = await db.insert(members).values({ firstName: first, lastName: last, email: `${first.toLowerCase()}@example.com`, phone, termsVersion: TERMS_VERSION, mandateAcceptedAt: new Date(), isDemo: true, title: (prof as { title?: string }).title ?? null, tier: last === "Laurent" || last === "Rahman" ? "assured" : "private", assuredSince: last === "Laurent" || last === "Rahman" ? new Date() : null, assuredRequestedAt: last === "Hale" ? new Date() : null }).returning();
  await db.insert(profiles).values({ memberId: m.id, data: { first, last, email: m.email, ...prof } });
  memberIds[last] = m.id;
}

const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
type S = { ref: string; who: string; f: string; t: string; date: string; time: string; pax: number; s: StandardId; stage: number; need?: string; sla?: string; wait?: string; flags?: string[]; tight?: boolean; chosen?: string; priced?: boolean; names?: string[]; note?: string };
const SAMPLES: S[] = [
  { ref: "MPJ-4846", who: "Hale", f: "LFPB", t: "LEMD", date: day(49), time: "08:00", pax: 7, s: "distinction", stage: 4, tight: true, need: "No offer at or below our price", sla: "Client answer due in 52 min", flags: ["All audited offers above the Assured Price"] },
  { ref: "MPJ-4833", who: "Whitmore", f: "EGLF", t: "LFMN", date: day(17), time: "11:00", pax: 8, s: "large", stage: 0, priced: false, need: "Send the final price", sla: "1 h 40 min left", flags: ["Party of 8 with oversized luggage: payload check"] },
  { ref: "MPJ-4821", who: "Laurent", f: "EGLF", t: "LSGS", date: day(71), time: "09:00", pax: 6, s: "distinction", stage: 4, need: "Choose the aircraft", sla: "1 h 12 min left", flags: ["Sion: crew qualification required", "Skis ×6: hold check in the RFQ"], note: "Sion needs a crew trained for its valley approach, so I am choosing only between operators qualified there. Six pairs of skis fit easily in this hold." },
  { ref: "MPJ-4815", who: "Kessler", f: "LFPB", t: "LFMN", date: day(15), time: "16:00", pax: 5, s: "distinction", stage: 7, chosen: "Operator C", need: "Approve operator payment", sla: "Due in 8 days" },
  { ref: "MPJ-4790", who: "Laurent", f: "LFPB", t: "LSGG", date: day(22), time: "10:30", pax: 4, s: "signature", stage: 6, chosen: "Operator B", wait: "Client payment due · reminder auto at T-7", names: ["Claire Laurent", "Marc Laurent"], note: "Your car will be at the aircraft at Le Bourget and in Geneva. If it snows, de-icing adds 15 to 30 minutes; I have already allowed for it." },
  { ref: "MPJ-4777", who: "Rahman", f: "LSGG", t: "LFMN", date: day(1), time: "09:15", pax: 3, s: "signature", stage: 10, chosen: "Operator A", wait: "Departs tomorrow · flight watch auto", names: ["Amir Rahman", "Leila Rahman", "Omar Rahman"] },
  { ref: "MPJ-4702", who: "Moreau", f: "LSGG", t: "EGLF", date: day(-5), time: "18:00", pax: 2, s: "signature", stage: 11, chosen: "Operator B", wait: "Feedback received · margin booked", names: ["Daniel Moreau", "Anne Moreau"] },
];

for (const x of SAMPLES) {
  const a = airport(x.f)!, z = airport(x.t)!;
  const trip = makeTrip({ from: x.f, to: x.t, date: x.date, time: x.time, pax: x.pax, ret: false, bags: "std", standUp: false, attendant: false, pets: false }, a, z);
  const p = price(x.s, trip);
  const offerRows = sampleOffers({ fromIcao: x.f, toIcao: x.t, date: x.date, pax: x.pax, standard: x.s }, x.tight);
  const chosen = offerRows.find((o) => o.operatorName === x.chosen);
  const [b] = await db.insert(bookings).values({
    ref: x.ref, memberId: memberIds[x.who], fromIcao: x.f, toIcao: x.t, date: x.date, time: x.time, pax: x.pax, standard: x.s,
    price: x.priced === false ? null : p.assured, estimate: x.priced === false ? p.assured : null, priceAcceptedAt: x.priced === false ? null : new Date(),
    currency: trip.cur, guarantee: x.priced === false ? "estimate" : "instant", stage: x.stage, needsAdvisor: x.need ?? null, sla: x.sla ?? null,
    waitingOn: x.wait ?? null, flags: x.flags ?? [], exception: Boolean(x.tight), operatorName: chosen?.operatorName ?? null, aircraft: chosen?.aircraft ?? null,
    payBy: day(Math.max(0, (+new Date(x.date) - Date.now()) / 864e5 - 5) | 0), advisorNote: x.note ?? null, keepPassports: x.who === "Laurent",
  }).returning();
  if (x.stage >= 3 || x.priced === false) await db.insert(offers).values(offerRows.map((o) => ({ ...o, bookingId: b.id, status: (o.operatorName === x.chosen ? "chosen" : "received") as "chosen" | "received" })));
  await db.insert(passengers).values(Array.from({ length: x.pax }, (_, i) => ({ bookingId: b.id, seat: i + 1, fullName: x.names?.[i] ?? null, passportStatus: (x.stage >= 10 || (x.names?.[i] && i === 0) ? "read" : "none") as "read" | "none" })));
  if (x.stage >= 6) await db.insert(payments).values({ bookingId: b.id, direction: "in", amount: p.assured, currency: trip.cur, status: x.stage > 6 ? "received" : "requested", method: x.stage > 6 ? "bank" : null });
  if (x.stage >= 8 && chosen) await db.insert(payments).values({ bookingId: b.id, direction: "out", amount: chosen.cost, currency: trip.cur, status: "paid", method: "bank" });
  const R = `${x.f}–${x.t} · ${x.date} · ${x.pax} pax`;
  const mail: (typeof operatorMessages.$inferInsert)[] = [{ bookingId: b.id, direction: "out", fromName: "MyPrivate-Jet Ops", toName: "12 qualified operators", label: "Booked + 2 min", subject: `RFQ ${x.ref} · ${R}`, body: `Request for quote. ${R}, ${x.time} local. Audited operators only, aircraft 2011 or newer. Price ceiling applies.`, aiNote: "Sent automatically (sample)", status: "sent" }];
  const quote = chosen ?? offerRows[1];
  if (x.stage >= 4 && quote) mail.push({ bookingId: b.id, direction: "in", fromName: quote.operatorName, label: "Booked + 35 min", subject: `Re: RFQ ${x.ref}`, body: `We can offer ${quote.aircraft} (${quote.year}), ${quote.base.toLowerCase()}. ${quote.cost} ${quote.currency} all-in, valid 48 h.`, aiNote: `Quote read: ${quote.aircraft} (${quote.year}) · ${quote.cost} ${quote.currency} · added to offers`, status: "received" });
  if (x.stage >= 6 && chosen) {
    mail.push({ bookingId: b.id, direction: "out", fromName: "MyPrivate-Jet Ops", toName: chosen.operatorName, label: "Chosen", subject: `Confirmation ${x.ref}`, body: "Please proceed. Charter agreement signed under the client's mandate attached. Please send the crew and the operator brief.", aiNote: "Sent automatically with the agreement (sample)", status: "sent" });
    mail.push({ bookingId: b.id, direction: "in", fromName: chosen.operatorName, label: "T-3 days", subject: `${x.ref} flight brief and crew`, body: "Please find the flight brief attached.", attachment: `${chosen.operatorName.replace(" ", "")}_Brief_${x.ref}.pdf`, aiNote: "Operator brief attached: ready to read into the flight brief", status: "received" });
  }
  await db.insert(operatorMessages).values(mail);
  if (x.stage >= 10) await db.insert(flightBriefs).values({ bookingId: b.id, fields: { date: x.date, etd: x.time, actype: chosen?.aircraft ?? "", dep_ap: x.f, arr_ap: x.t }, sentAt: new Date() });
}

await db.insert(chatMessages).values([
  { memberId: memberIds.Laurent, author: "member", body: "Could we leave Le Bourget 30 minutes earlier on the 19th?", context: "Paris to Geneva, MPJ-4790" },
  { memberId: memberIds.Hale, author: "member", body: "Is Madrid still possible on the 15th? We are flexible by an hour." },
]);

await pool.end();
console.log(`Sample data ready. Advisor sign-in: ${email}${process.env.ADVISOR_PASSWORD ? "" : " / change-me-now (development only)"}`);
