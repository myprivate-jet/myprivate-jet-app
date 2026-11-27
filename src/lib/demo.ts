import "server-only";
import { airport, cityOf } from "@/lib/pricing/airports";
import { makeTrip, price } from "@/lib/pricing/engine";
import { STANDARDS, type StandardId } from "@/lib/pricing/standards";
import { clientSteps } from "@/lib/booking/stages";
import type { ClientFlight } from "@/lib/booking/view";
import { money } from "@/lib/format";

/** Demo Office: a sample client, Mrs Claire Laurent. Names are illustrative; prices come from the live model. */
export const DEMO_PROFILE: Record<string, string | boolean> = {
  title: "Mrs", first: "Claire", last: "Laurent", nat: "French", email: "c.laurent@example.com", phone: "+41 ••• 208", lang: "Français", hours: "Weekdays before 10:00",
  city: "Geneva", country: "Switzerland", billsame: false, company: "Laurent Family Office", billemail: "office@example.com",
  t1: "Marc Laurent, husband", t2: "Léa Laurent, daughter", t3: "Hugo Laurent, son", diet: "No red meat", drinks: "Still water, champagne",
  cater: "Fruit and light salads. No flowers in the cabin.", cardep: true, cararr: true, pet: "Milo, Cavalier King Charles", petw: "9 kg",
};
export const DEMO_PREFS: [string, string][] = [["Luggage", "Skis in winter, suitcases otherwise"], ["Stand-up cabin", "Always on flights over 2 hours"], ["Cabin attendant", "Always"], ["Pets", "Travels with a small dog (Milo)"], ["On board", "Still water, fruit, no flowers"], ["On arrival", "Car at the aircraft"]];

function demoPrice(f: string, t: string, date: string, pax: number, s: StandardId) {
  const a = airport(f), b = airport(t);
  if (!a || !b) return null;
  const trip = makeTrip({ from: f, to: t, date, time: "10:00", pax, ret: false, bags: "std", standUp: false, attendant: false, pets: false }, a, b);
  return { v: price(s, trip).assured, cur: trip.cur };
}

export function demoFlights(): ClientFlight[] {
  const p1 = demoPrice("LFPB", "LSGG", "2026-12-19", 4, "signature")!;
  const p2 = demoPrice("EGLF", "LSGS", "2027-02-06", 6, "distinction")!;
  return [
    { ref: "MPJ-4790", fromCity: cityOf("LFPB"), toCity: cityOf("LSGG"), date: "2026-12-19", time: "10:30", pax: 4, standardName: STANDARDS.signature.name, ret: false, price: p1.v, currency: p1.cur, stage: 6, steps: clientSteps(6, false, false), payBy: "2026-12-15", aircraft: "Phenom 300E", names: ["Claire Laurent", "Marc Laurent", "", ""], passports: [true, false, false, false], keep: true, note: "Your car will be at the aircraft at Le Bourget and in Geneva. If it snows, de-icing adds 15 to 30 minutes; I have already allowed for it.", brief: null, guarantee: "instant", estimate: null, priceState: "fixed", declined: false },
    { ref: "MPJ-4821", fromCity: cityOf("EGLF"), toCity: cityOf("LSGS"), date: "2027-02-06", time: "09:00", pax: 6, standardName: STANDARDS.distinction.name, ret: false, price: p2.v, currency: p2.cur, stage: 4, steps: clientSteps(4, false, false), payBy: "2027-02-01", aircraft: null, names: ["", "", "", "", "", ""], passports: [false, false, false, false, false, false], keep: true, note: "Sion needs a crew trained for its valley approach, so I am choosing only between operators qualified there. Six pairs of skis fit easily in this hold.", brief: null, guarantee: "instant", estimate: null, priceState: "fixed", declined: false },
  ];
}

export function demoPast() {
  const rows: [string, string, string, number, StandardId, string][] = [
    ["LFMN", "LFPB", "2026-10-12", 3, "signature", "Flown as planned. Landed 6 minutes early."],
    ["LSGG", "LEIB", "2026-08-08", 5, "distinction", "The planned aircraft had a technical delay. A Praetor 600 of the same standard was flying 52 minutes later, at no cost to you."],
    ["LSGG", "LFMN", "2026-05-29", 4, "signature", "Monaco Grand Prix weekend. Confirmed 9 weeks ahead at the Assured Price."],
  ];
  return rows.map(([f, t, date, pax, s, line]) => {
    const p = demoPrice(f, t, date, pax, s);
    return { route: `${cityOf(f)} to ${cityOf(t)}`, standard: STANDARDS[s].name, price: p ? money(p.v, p.cur) : "", date, pax, line };
  });
}
