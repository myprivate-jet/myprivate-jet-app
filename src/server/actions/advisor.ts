"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/server/db";
import { currentStaff, endSession, startStaffSession, verifyPassword } from "@/server/auth/session";
import { aiAvailable, askOpsAssistant, draftOperatorEmail, readOperatorBrief } from "@/server/integrations/ai";
import { sendEmail } from "@/server/integrations/email";
import { audit, bookingDetail, pipeline } from "@/server/queries";
import { sampleBriefExtract } from "@/server/sample";
import { opsFallbackAnswer, bookingContext } from "@/server/ops-assistant";
import { BRIEF_SECTIONS } from "@/lib/booking/brief";
import { STANDARDS, type StandardId } from "@/lib/pricing/standards";
import { airport } from "@/lib/pricing/airports";
import { haversineKm, up100 } from "@/lib/pricing/engine";
import { addDays, todayISO } from "@/lib/format";

const { bookings, offers, payments, flightBriefs, operatorMessages, chatMessages, staff, members } = schema;
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function staffLogin(_: unknown, form: FormData): Promise<Result> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const pw = String(form.get("password") ?? "");
  const [s] = await db().select().from(staff).where(eq(staff.email, email)).limit(1);
  if (!s || !verifyPassword(pw, s.passwordHash)) return { ok: false, error: "Email or password is not right." };
  await startStaffSession(s.id);
  redirect("/advisor");
}

export async function staffLogout() {
  await endSession("staff");
  redirect("/advisor/login");
}

async function requireStaff() {
  const s = await currentStaff();
  if (!s) throw new Error("Advisor sign-in required.");
  return s;
}

async function byRef(ref: string) {
  const [b] = await db().select().from(bookings).where(eq(bookings.ref, ref)).limit(1);
  if (!b) throw new Error("Booking not found.");
  return b;
}

const done = () => revalidatePath("/advisor", "layout");

/** Choose an offer: the agreement is e-signed under the client's mandate and the payment link goes out. */
export async function chooseOffer(ref: string, offerId: string) {
  const s = await requireStaff();
  const b = await byRef(ref);
  const [o] = await db().select().from(offers).where(and(eq(offers.id, offerId), eq(offers.bookingId, b.id))).limit(1);
  if (!o) throw new Error("Offer not found.");
  if (!o.audited) throw new Error("This operator has no audit on file.");
  if (b.price != null && o.cost > b.price) throw new Error("This offer is above our price. We absorb nothing: use the exception options.");
  await db().update(offers).set({ status: "chosen" }).where(eq(offers.id, o.id));
  const payBy = b.payBy ?? (addDays(b.date, -5) < todayISO() ? todayISO() : addDays(b.date, -5));
  await db().update(bookings).set({
    stage: 6, operatorName: o.operatorName, aircraft: o.aircraft, needsAdvisor: null, sla: null, payBy,
    waitingOn: "Agreement signed under mandate · payment link sent", updatedAt: new Date(),
  }).where(eq(bookings.id, b.id));
  if (b.price != null) await db().insert(payments).values({ bookingId: b.id, direction: "in", amount: b.price, currency: b.currency, status: "requested" });
  await db().insert(operatorMessages).values({
    bookingId: b.id, direction: "out", fromName: "MyPrivate-Jet Ops", toName: o.operatorName, label: "Chosen", subject: `Confirmation ${ref}`,
    body: "Please proceed. Charter agreement signed under the client's mandate attached. Please send the crew and the operator brief.",
    aiNote: "Prepared automatically with the agreement. Operator email is not connected yet.", status: "queued",
  });
  await audit(s.email, "offer.chosen", { bookingId: b.id }, { operator: o.operatorName, cost: o.cost, agreement: "e-signature pending provider" });
  done();
}

/** Confirmed or free: upgrade at no extra cost, one new price, or a free release. We absorb nothing. */
export async function resolveException(ref: string, kind: "upgrade" | "newprice" | "release", newPrice?: number) {
  const s = await requireStaff();
  const b = await byRef(ref);
  if (kind === "upgrade") {
    const order: StandardId[] = ["reach", "signature", "distinction", "large", "privilege"];
    const next = order[order.indexOf(b.standard as StandardId) + 1] ?? b.standard;
    await db().update(bookings).set({ upgradedTo: next, exception: false, needsAdvisor: "Choose the aircraft", waitingOn: `Upgrade to ${STANDARDS[next as StandardId]?.name ?? next} at the same price`, updatedAt: new Date() }).where(eq(bookings.id, b.id));
  } else if (kind === "newprice") {
    if (!newPrice || newPrice <= 0) throw new Error("Give the new final price.");
    await db().update(bookings).set({ exception: false, needsAdvisor: null, sla: null, waitingOn: `New price ${up100(newPrice)} sent · waiting for the client's tap`, advisorNote: `We could not hold the original price for this standard. One new final price is in your Office: accept or decline with one tap. Declining costs nothing.`, updatedAt: new Date() }).where(eq(bookings.id, b.id));
  } else {
    await db().update(bookings).set({ stage: 11, exception: false, needsAdvisor: null, sla: null, waitingOn: "Released at no cost · note sent", advisorNote: "We could not secure an aircraft of this standard at your price, so we have released the booking at no cost. Your advisor will suggest alternatives.", updatedAt: new Date() }).where(eq(bookings.id, b.id));
  }
  await audit(s.email, `exception.${kind}`, { bookingId: b.id }, { newPrice });
  done();
}

/** For trips outside automatic pricing: the advisor sets one final price. */
export async function setAdvisorPrice(ref: string, priceValue: number) {
  const s = await requireStaff();
  const b = await byRef(ref);
  if (!(priceValue > 0)) throw new Error("Give a price.");
  await db().update(bookings).set({ price: up100(priceValue), stage: 3, needsAdvisor: null, sla: null, waitingOn: "RFQ sent to qualified operators", priceValidUntil: new Date(Date.now() + 24 * 36e5), updatedAt: new Date() }).where(eq(bookings.id, b.id));
  await audit(s.email, "price.set", { bookingId: b.id }, { price: up100(priceValue) });
  done();
}

export async function approveOperatorPayment(ref: string) {
  const s = await requireStaff();
  const b = await byRef(ref);
  const [o] = await db().select().from(offers).where(and(eq(offers.bookingId, b.id), eq(offers.status, "chosen"))).limit(1);
  if (o) await db().insert(payments).values({ bookingId: b.id, direction: "out", amount: o.cost, currency: o.currency, status: "paid", method: "bank (manual until bank API is connected)" });
  await db().update(bookings).set({ stage: 8, needsAdvisor: null, sla: null, waitingOn: "Operator paid · awaiting passenger names", updatedAt: new Date() }).where(eq(bookings.id, b.id));
  await audit(s.email, "operator.paid", { bookingId: b.id }, { amount: o?.cost });
  done();
}

/** Demo helper: run the next automatic step (until the real automations are connected). */
export async function advanceStage(ref: string) {
  const s = await requireStaff();
  const b = await byRef(ref);
  const next = Math.min(11, b.stage + 1);
  await db().update(bookings).set({ stage: next, needsAdvisor: next === 4 ? "Choose the aircraft" : next === 7 ? "Approve operator payment" : null, waitingOn: null, updatedAt: new Date() }).where(eq(bookings.id, b.id));
  await audit(s.email, "stage.advanced", { bookingId: b.id }, { to: next });
  done();
}

// ---------- Flight brief

export async function saveBrief(ref: string, fields: Record<string, string>) {
  await requireStaff();
  const b = await byRef(ref);
  const allowed = new Set(BRIEF_SECTIONS.flatMap(([, fs]) => fs.map((f) => f[0])));
  const clean = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.has(k)).map(([k, v]) => [k, String(v).slice(0, 2000)]));
  await db().insert(flightBriefs).values({ bookingId: b.id, fields: clean }).onConflictDoUpdate({ target: flightBriefs.bookingId, set: { fields: clean, updatedAt: new Date() } });
}

/** Read an operator brief (PDF, photo) into the fields with AI, or a sample when AI is not connected. */
export async function readBrief(ref: string, form: FormData): Promise<Result<{ fields: Record<string, string>; fromOperator: string[]; simulated: boolean }>> {
  await requireStaff();
  const b = await byRef(ref);
  const file = form.get("file");
  let extracted: Record<string, string> | null = null;
  let simulated = true;
  if (file instanceof File && file.size > 0 && aiAvailable()) {
    if (file.size > 20 * 1024 * 1024) return { ok: false, error: "File too large (20 MB max)." };
    const parsed = await readOperatorBrief({ data: Buffer.from(await file.arrayBuffer()), mime: file.type || "application/pdf" });
    if (parsed) { extracted = parsed; simulated = false; }
  }
  if (!extracted) {
    const a = airport(b.fromIcao), z = airport(b.toIcao);
    const hrs = a && z ? haversineKm(a, z) / (STANDARDS[b.standard as StandardId]?.speed ?? 800) + 0.3 : 1;
    extracted = sampleBriefExtract(b, hrs);
  }
  const fromOperator = Object.entries(extracted).filter(([, v]) => v).map(([k]) => k);
  const [cur] = await db().select().from(flightBriefs).where(eq(flightBriefs.bookingId, b.id)).limit(1);
  const fields = { ...(cur?.fields ?? {}), ...Object.fromEntries(Object.entries(extracted).filter(([, v]) => v)) };
  await db().insert(flightBriefs).values({ bookingId: b.id, fields, fromOperator }).onConflictDoUpdate({ target: flightBriefs.bookingId, set: { fields, fromOperator, updatedAt: new Date() } });
  done();
  return { ok: true, fields, fromOperator, simulated };
}

export async function sendBrief(ref: string) {
  const s = await requireStaff();
  const b = await byRef(ref);
  await db().update(flightBriefs).set({ sentAt: new Date() }).where(eq(flightBriefs.bookingId, b.id));
  if (b.stage >= 6 && b.stage < 10) await db().update(bookings).set({ waitingOn: "Flight brief sent to client" }).where(eq(bookings.id, b.id));
  const [m] = await db().select().from(members).where(eq(members.id, b.memberId)).limit(1);
  if (m && !m.isDemo) await sendEmail({ to: m.email, subject: `Your flight brief · ${ref}`, text: `Your flight brief for ${ref} is in your Private Office.` });
  await audit(s.email, "brief.sent", { bookingId: b.id });
  done();
}

// ---------- Operator mail

export async function draftOperatorMail(ref: string): Promise<Result<{ text: string; ai: boolean }>> {
  await requireStaff();
  const d = await bookingDetail(ref);
  if (!d) return { ok: false, error: "Booking not found." };
  const B = d.brief?.fields ?? {};
  const miss: string[] = [];
  if (!B.capt) miss.push("the crew names");
  if (!B.dep_fbo) miss.push(`the FBO at ${airport(d.booking.fromIcao)?.[3] ?? d.booking.fromIcao}`);
  if (!B.arr_fbo) miss.push(`the FBO at ${airport(d.booking.toIcao)?.[3] ?? d.booking.toIcao}`);
  if (!B.reg) miss.push("the aircraft registration");
  if (aiAvailable()) {
    try {
      return { ok: true, text: await draftOperatorEmail(bookingContext(d), miss), ai: true };
    } catch {
      /* fall through to the template */
    }
  }
  const p = d.profile as Record<string, string>;
  const prefs = [p.drinks, p.diet, p.cater, p.pet ? `Pet: ${p.pet}${p.petw ? `, ${p.petw}` : ""}` : ""].filter(Boolean).join(". ");
  const text = `Dear Operations team,\n\nThank you for ${ref} (${d.booking.fromIcao}–${d.booking.toIcao}, ${d.booking.date}, ${d.booking.pax} passengers).\n${miss.length ? `Could you please confirm ${miss.join(", ")}` : "Could you please confirm that nothing has changed"} by tomorrow 12:00?\n${prefs ? `On board, our client would like: ${prefs}.\n` : ""}\nKind regards,\nMyPrivate-Jet Operations`;
  return { ok: true, text, ai: false };
}

export async function sendOperatorMail(ref: string, body: string) {
  const s = await requireStaff();
  const b = await byRef(ref);
  const text = body.trim().slice(0, 10000);
  if (!text) return;
  await db().insert(operatorMessages).values({ bookingId: b.id, direction: "out", fromName: s.name, toName: b.operatorName ?? "Operator", label: "Now", subject: `Re: ${ref}`, body: text, aiNote: "Operator mailbox not connected yet: saved, not sent.", status: "queued" });
  await audit(s.email, "operator.mail", { bookingId: b.id });
  done();
}

// ---------- Client chat

export async function replyToClient(memberId: string, body: string) {
  const s = await requireStaff();
  const text = body.trim().slice(0, 4000);
  if (!text) return;
  await db().insert(chatMessages).values({ memberId, author: "advisor", staffId: s.id, body: text });
  await db().update(chatMessages).set({ readAt: new Date() }).where(and(eq(chatMessages.memberId, memberId), eq(chatMessages.author, "member"), isNull(chatMessages.readAt)));
  done();
}

// ---------- Flight Ops assistant

export async function askOps(question: string, ref?: string): Promise<{ answer: string; ai: boolean }> {
  await requireStaff();
  const q = question.trim().slice(0, 2000);
  const list = await pipeline();
  const sel = ref ? await bookingDetail(ref) : null;
  if (aiAvailable()) {
    try {
      const ctx = list.map((b) => `${b.ref} · ${b.client} · ${b.fromIcao}-${b.toIcao} · ${b.date} ${b.time} · ${b.pax} pax · ${b.standard} · stage ${b.stage} · ${b.needsAdvisor ? "NEEDS ADVISOR: " + b.needsAdvisor : "auto: " + (b.waitingOn ?? "")} · flags: ${b.flags.join("; ")}`).join("\n") + (sel ? `\n\nSelected booking detail:\n${bookingContext(sel)}` : "");
      return { answer: await askOpsAssistant(q, ctx), ai: true };
    } catch {
      /* fall back */
    }
  }
  return { answer: opsFallbackAnswer(q, list, sel), ai: false };
}
