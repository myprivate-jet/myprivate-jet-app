/**
 * Assured Price engine (server side only: the model never ships to browsers).
 *
 * Price = P90 of a log-linear offer model trained on real charter offers
 * (see model.json), plus US federal tax on US domestic trips, rounded up to the
 * next 100. Clients see one recommended standard and one final price. Ranges,
 * reason codes and quantiles are for the advisor audit only.
 */
import MODEL from "./model.json";
import { ORDER, STANDARDS, type StandardId } from "./standards";
import { AIRPORT_NOTES, eventFor, type PeakEvent } from "./knowledge";
import type { Airport } from "./airports";

export const CONFIRM_HOURS = 2;
const ASSURED_Q = 3; // resq index 3 = P90
/**
 * Two membership levels (decided 2026-11-27).
 * Private (free): the price on screen is an estimate; the advisor sends one final price within CONFIRM_HOURS.
 * Assured (annual fee): the price on screen is guaranteed, any day including peak dates, with this much notice.
 */
export type Tier = "guest" | "private" | "assured";
export type Guarantee = "estimate" | "instant" | "with-aircraft";
export const ASSURED_NOTICE_HOURS = { europe: 72, elsewhere: 96 } as const;

const EU = new Set("AL AD AT BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS SE SI SK SM UA VA XK TR".split(" "));
const ME = new Set("AE SA QA KW BH OM JO LB IL IQ IR YE SY EG".split(" "));
const AMN = new Set("CA MX BS BB BM BZ CU DM DO GD GT HN HT JM KN KY LC NI PA PR SV TC TT VC VG VI AW CW SX MF BL AI AG".split(" "));
const GULF = new Set("AE SA QA KW BH OM".split(" "));
const HOTHIGH = new Set("KLAS KPHX KSDL KASE KEGE KTEX KPSP KTUS KABQ KSAF KDEN KAPA KHDN KMTJ KJAC".split(" "));

export type Region = "US" | "AM" | "EU" | "ME" | "OT" | "INTER";
export type Currency = "EUR" | "USD";
export type Luggage = "std" | "ski" | "golf" | "large";

export interface TripInput {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  pax: number;
  ret: boolean;
  rdate?: string;
  bags: Luggage;
  standUp: boolean;
  attendant: boolean;
  pets: boolean;
}

export interface Trip extends TripInput {
  a: Airport;
  b: Airport;
  km: number;
  route: Region;
  cur: Currency;
  hour: number;
}

export interface Price {
  /** Advisor audit only */
  quantiles: number[];
  assured: number;
  tax: number;
}

export type ScreenStatus = "ok" | "adv" | "off";
export interface Screen {
  st: ScreenStatus;
  codes: [string, string][];
  hrs: number;
  price?: Price;
}

const regionOf = (c: string): Region =>
  c === "US" ? "US" : AMN.has(c) ? "AM" : EU.has(c) ? "EU" : ME.has(c) ? "ME" : "OT";

export const up100 = (v: number) => Math.ceil(v / 100) * 100;

export function haversineKm(a: Airport, b: Airport) {
  const t = Math.PI / 180;
  const x = Math.sin(((b[5] - a[5]) * t) / 2) ** 2 + Math.cos(a[5] * t) * Math.cos(b[5] * t) * Math.sin(((b[6] - a[6]) * t) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

export function makeTrip(input: TripInput, a: Airport, b: Airport): Trip {
  const km = haversineKm(a, b);
  const ra = regionOf(a[4]);
  const rb = regionOf(b[4]);
  const route: Region =
    ra === "US" && rb === "US" ? "US" : (ra === "US" || ra === "AM") && (rb === "US" || rb === "AM") ? "AM" : ra === rb ? ra : "INTER";
  const cur: Currency = route === "US" || route === "AM" ? "USD" : route === "EU" ? "EUR" : "USD";
  return { ...input, a, b, km, route, cur, hour: +(input.time || "10").slice(0, 2) };
}

export function price(s: StandardId, t: Trip): Price {
  const k = MODEL.coef;
  const lk = Math.log(t.km);
  const r = t.ret ? 1 : 0;
  const us = t.route === "US" || t.route === "AM" ? 1 : 0;
  const i = MODEL.stds.indexOf(s);
  let x = k[0] + k[1] * lk + k[2] * r + k[4] * (r ? Math.log(2) : 0) + k[5] * us + k[6];
  if (i > 0) x += k[7 + 2 * (i - 1)] + k[8 + 2 * (i - 1)] * lk;
  const f = t.cur === "USD" ? MODEL.fx.USD_per_EUR : 1;
  const resq = (MODEL.resq as Record<string, number[]>)[s];
  const q = resq.map((v) => Math.exp(x + v) * f);
  const assured = q[ASSURED_Q];
  let tax = 0;
  if (t.route === "US") tax = 0.075 * assured + 5.3 * t.pax * (t.ret ? 2 : 1);
  return { quantiles: q, assured: up100(assured + tax), tax: Math.round(tax) };
}

export function screen(s: StandardId, t: Trip): Screen {
  const d = STANDARDS[s];
  const hrs = t.km / d.speed + 0.3;
  const out: [string, string][] = [];
  const adv: [string, string][] = [];
  const m = +t.date.slice(5, 7);
  if (t.km > d.screenKm) out.push(["RANGE", "Cannot fly this distance nonstop"]);
  if (t.pax > d.maxPax) out.push(["CAPACITY", `Seats up to ${d.maxPax} in comfort`]);
  if (t.standUp && !d.standUp) out.push(["CABIN", "No stand-up cabin"]);
  if (t.attendant && !d.attendant) out.push(["CABIN", "No cabin attendant as standard"]);
  if (out.length) return { st: "off", codes: out, hrs };
  if (t.km > 0.85 * d.screenKm) adv.push(["RANGE", "Close to its range: we check payload and winds"]);
  if (hrs > d.maxH) adv.push(["DURATION", "A long time in this cabin: we confirm it suits you"]);
  if (t.bags !== "std" && !d.skis) adv.push(["BAGGAGE", "Your luggage needs a hold check"]);
  if ((GULF.has(t.a[4]) || HOTHIGH.has(t.a[0])) && m >= 5 && m <= 9 && t.km > 0.6 * d.screenKm)
    adv.push(["PAYLOAD", "Hot-weather departure: performance checked personally"]);
  if ((s === "privilege" || s === "large") && hrs > 6 && t.pax > 8 && (t.hour >= 19 || t.hour <= 2))
    adv.push(["CABIN", "Overnight: sleeping places confirmed personally"]);
  if (t.route === "ME") adv.push(["DATA", "Middle East trips are priced personally by your advisor"]);
  if (t.route === "INTER") adv.push(["RIGHTS", "Trips between regions are priced personally by your advisor"]);
  if (t.route === "OT") adv.push(["DATA", "This region is priced personally by your advisor"]);
  const n = (MODEL.n as Record<string, { EU: number; US: number }>)[s];
  const nn = t.route === "US" || t.route === "AM" ? n.US : n.EU;
  if (!adv.length && nn < 50) adv.push(["SUPPLY", "Priced personally: few comparable trips on record"]);
  if (!adv.length && t.km > (MODEL.kmrange as Record<string, number[]>)[s][1]) adv.push(["DATA", "Priced personally: longer than our usual trips"]);
  const res: Screen = { st: adv.length ? "adv" : "ok", codes: adv, hrs };
  if (res.st === "ok") res.price = price(s, t);
  return res;
}

export function screenAll(t: Trip): Record<StandardId, Screen> {
  return Object.fromEntries(ORDER.map((s) => [s, screen(s, t)])) as Record<StandardId, Screen>;
}

/** The smallest priced standard that fits the party with a spare seat, stays within its comfort time and carries the luggage. */
export function recommend(t: Trip, R: Record<StandardId, Screen>): StandardId | null {
  for (const s of ORDER) {
    const r = R[s];
    if (r.st !== "ok") continue;
    const d = STANDARDS[s];
    if (t.pax > d.maxPax - 1 && s !== "privilege") continue;
    if (r.hrs > d.comfortH) continue;
    if (t.bags !== "std" && (s === "reach" || (s === "signature" && t.pax >= 5))) continue;
    return s;
  }
  return ORDER.find((s) => R[s].st === "ok") ?? null;
}

export const hm = (h: number) => {
  const m = Math.round((h * 60) / 5) * 5;
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
};

export function why(s: StandardId, t: Trip, R: Record<StandardId, Screen>): string {
  const d = STANDARDS[s];
  const r = R[s];
  const parts = [`${d.name} fits ${t.pax} guest${t.pax > 1 ? "s" : ""} with room to spare and keeps ${hm(r.hrs)} in the air comfortable.`];
  const smaller = ORDER.slice(0, ORDER.indexOf(s)).filter((x) => R[x].st !== "off");
  if (smaller.length) {
    const x = smaller[smaller.length - 1];
    if (STANDARDS[x].comfortH < R[x].hrs) parts.push(`${STANDARDS[x].name} would also fly it, but not comfortably for that long.`);
    else if (t.bags !== "std") parts.push(`${STANDARDS[x].name} would be tight with your luggage.`);
    else if (t.pax > STANDARDS[x].maxPax - 1) parts.push(`${STANDARDS[x].name} would be full.`);
  }
  return parts.join(" ");
}

/** "Worth knowing" lessons. Text uses **bold** markers rendered by the UI. */
export function insights(s: StandardId, t: Trip, R: Record<StandardId, Screen>, ev: PeakEvent | null): string[] {
  const d = STANDARDS[s];
  const r = R[s];
  const out: string[] = [];
  if (ev) out.push(`**Your date falls on ${ev.name}.** Aircraft are scarce and late requests often fail. On peak dates the price is confirmed together with the aircraft, so book early.`);
  const m = +t.date.slice(5, 7);
  const note = [t.b, t.a].map((a) => AIRPORT_NOTES[a[0]]).find(Boolean);
  if (note) out.push(`**Worth knowing:** ${note}`);
  else if (t.ret && t.rdate === t.date) out.push("**Worth knowing:** on a same-day return the crew waits for you. That usually costs less than flying the aircraft home empty and back again, and it is already in your price.");
  else if ((m === 12 || m <= 2) && t.route !== "ME") out.push("**Worth knowing:** winter mornings can need de-icing, which adds 15 to 30 minutes on the ground. We build that into your timing, so it does not become a delay.");
  else if (r.hrs > d.comfortH * 0.8) out.push("**Worth knowing:** the time in the air is close to what this cabin is comfortable for. That is why the cabin choice matters more than the price on this trip.");
  else out.push(`**Worth knowing:** your price includes flying the aircraft to ${t.a[3] || t.a[2]} if it is based elsewhere. Positioning is never shown or charged separately.`);
  if (t.bags === "ski") out.push(d.skis ? `**Skis travel in the hold.** We confirm the hold takes ${t.pax} pairs before you fly.` : "**Skis are a challenge in this cabin.** The Signature or larger carries them easily.");
  if (t.bags === "golf") out.push(`**Golf bags:** ${d.skis ? "the hold takes them; we confirm the count." : "tight in this cabin; consider The Signature."}`);
  if (t.pets) out.push(`**Pets:** We arrange entry papers for ${t.b[3] || "your destination"} and an operator that welcomes them in the cabin.`);
  return out;
}

export function facts(s: StandardId, t: Trip, R: Record<StandardId, Screen>) {
  const d = STANDARDS[s];
  const r = R[s];
  const airlineMin = Math.round((t.km / 780) * 60 + 150);
  return [
    { k: "In the air", v: hm(r.hrs), d: `${Math.round(t.km).toLocaleString("en-GB")} km, nonstop${t.ret ? ", each way" : ""}` },
    { k: "Cabin height", v: d.height, d: `${d.standUp ? "Stand-up cabin" : "Seated cabin"}. ${d.lavatory === "Not on every aircraft" ? "Lavatory on some aircraft" : d.lavatory + " lavatory"}.` },
    { k: "Door to door", v: `About ${hm((r.hrs * 60 + 45) / 60)}`, d: `Against about ${hm(airlineMin / 60 + (t.km < 1500 ? 1 : 1.5))} by airline, with security and queues` },
  ];
}

/** Hours of notice an Assured member needs for an instant guaranteed price on this trip. */
export const assuredNotice = (t: Pick<Trip, "route">) => (t.route === "EU" ? ASSURED_NOTICE_HOURS.europe : ASSURED_NOTICE_HOURS.elsewhere);

/**
 * What the price on screen means.
 * Guests and Private members see an estimate. Assured members see a guaranteed price,
 * except inside the notice period, where the price is confirmed together with the aircraft.
 */
export function guarantee(t: Trip, tier: Tier, now = new Date()): Guarantee {
  if (tier !== "assured") return "estimate";
  const hoursAway = (new Date(`${t.date}T${t.time || "12:00"}:00`).getTime() - now.getTime()) / 36e5;
  return hoursAway < assuredNotice(t) ? "with-aircraft" : "instant";
}

export interface QuoteResult {
  trip: { from: string; to: string; fromCity: string; toCity: string; fromName: string; toName: string; km: number; route: Region; cur: Currency; date: string; time: string; pax: number; ret: boolean; rdate?: string };
  recommended: StandardId | null;
  shown: StandardId | null;
  /** Client-safe per-standard summary (no quantiles). */
  standards: Record<StandardId, { st: ScreenStatus; note: string | null; hrs: number; price: number | null }>;
  why: string;
  facts: { k: string; v: string; d: string }[];
  insights: string[];
  event: string | null;
  guarantee: Guarantee;
  tier: Tier;
  /** Hours of notice for an instant Assured price on this trip. */
  notice: number;
  /** When no standard is priced automatically, the one the advisor prices. */
  advisorStandard: StandardId | null;
  advisorReason: string | null;
}

export function quote(t: Trip, pick?: StandardId | null, now = new Date(), tier: Tier = "guest"): QuoteResult {
  const R = screenAll(t);
  const auto = recommend(t, R);
  const pickSt = pick ? R[pick]?.st : undefined;
  const shown = pick && pickSt === "ok" ? pick : pick && pickSt === "adv" ? null : auto;
  const ev = eventFor(t.date, [t.a[0], t.b[0]]);
  const advS = shown ? null : pick && pickSt === "adv" ? pick : ORDER.find((x) => R[x].st === "adv") ?? null;
  const focus = shown ?? advS;
  return {
    trip: { from: t.a[0], to: t.b[0], fromCity: t.a[3] || t.a[2], toCity: t.b[3] || t.b[2], fromName: t.a[2], toName: t.b[2], km: Math.round(t.km), route: t.route, cur: t.cur, date: t.date, time: t.time, pax: t.pax, ret: t.ret, rdate: t.rdate },
    recommended: auto,
    shown,
    standards: Object.fromEntries(
      ORDER.map((s) => [s, { st: R[s].st, note: R[s].codes[0]?.[1] ?? null, hrs: R[s].hrs, price: R[s].price?.assured ?? null }]),
    ) as QuoteResult["standards"],
    why: shown ? (shown === auto ? why(shown, t, R) : STANDARDS[shown].line) : "",
    facts: focus ? facts(focus, t, R) : [],
    insights: focus ? insights(focus, t, R, ev) : [],
    event: ev?.name ?? null,
    guarantee: guarantee(t, tier, now),
    tier,
    notice: assuredNotice(t),
    advisorStandard: advS,
    advisorReason: advS ? R[advS].codes[0][1] : null,
  };
}

export const MODEL_INFO = {
  trainedOn: MODEL.trained_on as number,
  requests: MODEL.requests as number,
  validation: MODEL.validation,
  /** Charter level vs 2025, all routes like-for-like */
  levelVs2025: Math.round((Math.exp(MODEL.coef[6]) - 1) * 100),
};
