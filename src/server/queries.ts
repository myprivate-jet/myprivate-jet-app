import "server-only";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import type { Booking, Passenger } from "@/server/db/schema";

const { bookings, passengers, flightBriefs, offers, payments, operatorMessages, chatMessages, members, profiles, auditEvents } = schema;

export interface BookingView extends Booking {
  passengers: Passenger[];
  briefSent: boolean;
  briefFields: Record<string, string> | null;
  paxComplete: boolean;
}

async function enrich(rows: Booking[]): Promise<BookingView[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [px, br] = await Promise.all([
    db().select().from(passengers).where(inArray(passengers.bookingId, ids)).orderBy(asc(passengers.seat)),
    db().select().from(flightBriefs).where(inArray(flightBriefs.bookingId, ids)),
  ]);
  return rows.map((r) => {
    const p = px.filter((x) => x.bookingId === r.id);
    const b = br.find((x) => x.bookingId === r.id);
    const named = p.filter((x) => x.fullName).length;
    const pp = p.filter((x) => x.passportStatus === "read").length;
    return { ...r, passengers: p, briefSent: Boolean(b?.sentAt), briefFields: b?.sentAt ? b.fields : null, paxComplete: named >= r.pax && pp >= r.pax };
  });
}

export async function memberBookings(memberId: string) {
  const rows = await db().select().from(bookings).where(eq(bookings.memberId, memberId)).orderBy(asc(bookings.date));
  return enrich(rows);
}

export async function memberProfile(memberId: string) {
  const [p] = await db().select().from(profiles).where(eq(profiles.memberId, memberId)).limit(1);
  return p?.data ?? {};
}

export async function memberChat(memberId: string) {
  return db().select().from(chatMessages).where(eq(chatMessages.memberId, memberId)).orderBy(asc(chatMessages.createdAt)).limit(200);
}

// ---------- Advisor

export async function pipeline() {
  const rows = await db()
    .select({ b: bookings, first: members.firstName, last: members.lastName, title: members.title })
    .from(bookings)
    .innerJoin(members, eq(members.id, bookings.memberId))
    .orderBy(sql`${bookings.needsAdvisor} is null`, asc(bookings.date));
  const views = await enrich(rows.map((r) => r.b));
  const all = await db().select().from(offers).where(inArray(offers.bookingId, views.map((v) => v.id).concat(["00000000-0000-0000-0000-000000000000"])));
  return views.map((v, i) => ({
    ...v,
    client: `${rows[i].first.charAt(0)}. ${rows[i].last}`,
    chosenCost: all.find((o) => o.bookingId === v.id && o.status === "chosen")?.cost ?? null,
  }));
}

export async function bookingDetail(ref: string) {
  const [row] = await db().select().from(bookings).where(eq(bookings.ref, ref)).limit(1);
  if (!row) return null;
  const [[view], [member], prof, off, pay, brief, mail, audit] = await Promise.all([
    enrich([row]),
    db().select().from(members).where(eq(members.id, row.memberId)).limit(1),
    memberProfile(row.memberId),
    db().select().from(offers).where(eq(offers.bookingId, row.id)).orderBy(asc(offers.cost)),
    db().select().from(payments).where(eq(payments.bookingId, row.id)).orderBy(asc(payments.createdAt)),
    db().select().from(flightBriefs).where(eq(flightBriefs.bookingId, row.id)).limit(1),
    db().select().from(operatorMessages).where(eq(operatorMessages.bookingId, row.id)).orderBy(asc(operatorMessages.createdAt)),
    db().select().from(auditEvents).where(eq(auditEvents.bookingId, row.id)).orderBy(desc(auditEvents.createdAt)).limit(30),
  ]);
  return { booking: view, member, profile: prof, offers: off, payments: pay, brief: brief[0] ?? null, mail, audit };
}

export async function advisorInbox() {
  const rows = await db()
    .select({ m: chatMessages, first: members.firstName, last: members.lastName })
    .from(chatMessages)
    .innerJoin(members, eq(members.id, chatMessages.memberId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(300);
  const threads = new Map<string, { memberId: string; client: string; last: typeof rows[number]["m"]; unread: number; messages: typeof rows[number]["m"][] }>();
  for (const r of rows) {
    const t = threads.get(r.m.memberId) ?? { memberId: r.m.memberId, client: `${r.first} ${r.last}`, last: r.m, unread: 0, messages: [] };
    t.messages.unshift(r.m);
    if (r.m.author === "member" && !r.m.readAt) t.unread++;
    threads.set(r.m.memberId, t);
  }
  return [...threads.values()];
}

export async function audit(actor: string, action: string, ids: { bookingId?: string; memberId?: string }, detail?: Record<string, unknown>) {
  await db().insert(auditEvents).values({ actor, action, bookingId: ids.bookingId, memberId: ids.memberId, detail });
}
