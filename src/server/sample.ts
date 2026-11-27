import "server-only";
import { airport } from "@/lib/pricing/airports";
import { makeTrip, price, type Luggage } from "@/lib/pricing/engine";
import { STANDARDS, type StandardId } from "@/lib/pricing/standards";

/**
 * Sample operator offers, used until real operator RFQs are connected.
 * Cost multiples are calibrated on the OPES JET back-test (about 28% margin on
 * the suggested offer). Operators are anonymised as "Operator A–D".
 */
export function sampleOffers(b: { fromIcao: string; toIcao: string; date: string; pax: number; standard: string; luggage?: string }, tight = false) {
  const a = airport(b.fromIcao);
  const z = airport(b.toIcao);
  if (!a || !z) return [];
  const s = b.standard as StandardId;
  const t = makeTrip({ from: a[0], to: z[0], date: b.date, time: "10:00", pax: b.pax, ret: false, bags: (b.luggage ?? "std") as Luggage, standUp: false, attendant: false, pets: false }, a, z);
  const p = price(s, t);
  const cap = p.assured - p.tax;
  const ex = STANDARDS[s].examples.split(",").map((x) => x.trim());
  const rows = tight
    ? [["Operator D", ex[0], 2008, "Positioning 1 h 30", false, 1.06], ["Operator B", ex[0], 2018, "Positioning 50 min", true, 1.13], ["Operator C", ex[1] ?? ex[0], 2015, "Based at departure", true, 1.19], ["Operator A", ex[2] ?? ex[0], 2022, "Based at departure", true, 1.27]]
    : [["Operator D", ex[0], 2009, "Positioning 1 h", false, 0.66], ["Operator B", ex[0], 2019, "Based at departure", true, 0.72], ["Operator C", ex[1] ?? ex[0], 2016, "Positioning 40 min", true, 0.79], ["Operator A", ex[2] ?? ex[0], 2021, "Based at departure", true, 0.86]];
  return rows.map(([op, ac, yr, base, aud, k]) => ({
    operatorName: op as string,
    aircraft: ac as string,
    year: yr as number,
    base: base as string,
    audited: aud as boolean,
    cost: Math.round((cap * (k as number)) / 100) * 100,
    currency: t.cur,
  }));
}

/** Sample operator brief contents, used when no AI document reader is connected. */
export function sampleBriefExtract(b: { fromIcao: string; toIcao: string; time: string; aircraft: string | null; standard: string }, flightHours: number) {
  const [h, m] = b.time.split(":").map(Number);
  const arr = new Date(2000, 0, 1, h, m + Math.round(flightHours * 60));
  const show = new Date(2000, 0, 1, h, m - 30);
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const from = airport(b.fromIcao)?.[3] ?? b.fromIcao;
  const to = airport(b.toIcao)?.[3] ?? b.toIcao;
  const std = STANDARDS[b.standard as StandardId];
  return {
    etd: b.time,
    eta: hhmm(arr),
    actype: b.aircraft ?? std?.examples.split(",")[0] ?? "",
    reg: "F-HXXX (sample)",
    callsign: "XXX123 (sample)",
    dep_fbo: "Business aviation terminal (sample)",
    dep_addr: `Sample address, ${from}`,
    dep_phone: "+33 1 00 00 00 00 (sample)",
    dep_show: hhmm(show),
    dep_notes: "Cars allowed to the aircraft with plates sent 24 h ahead.",
    arr_fbo: "Private aviation terminal (sample)",
    arr_addr: `Sample address, ${to}`,
    arr_phone: "+41 22 000 00 00 (sample)",
    arr_notes: "Customs at the terminal, about 5 minutes.",
    capt: "Capt. L. Benoit (sample)",
    capt_ph: "+33 6 00 00 00 00 (sample)",
    fo: "F/O M. Keller (sample)",
    ca: std?.attendant ? "A. Rossi (sample)" : "",
    ops_ph: "+33 1 00 00 00 01 (sample)",
    wx: "Operator outlook: dry, light wind. Updated 24 h before.",
  };
}
