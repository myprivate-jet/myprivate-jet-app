import type { ClientFlight } from "./view";
import { money, shortDate } from "@/lib/format";

export type NextAction =
  | { kind: "accept" | "pay" | "pax"; f: ClientFlight; title: string; line: string }
  | { kind: "wait" | "plan"; f?: ClientFlight; title: string; line: string };

/**
 * The single thing the client should do now, or, when there is nothing to do, what happens next and when.
 * Order: accept a price, pay, add passengers close to departure, otherwise reassure.
 */
export function nextAction(flights: ClientFlight[], today = new Date()): NextAction {
  const route = (f: ClientFlight) => `${f.fromCity} to ${f.toCity}`;
  const offered = flights.find((f) => f.priceState === "offered" && !f.declined);
  if (offered) return { kind: "accept", f: offered, title: `Your final price is ready: ${money(offered.price!, offered.currency)}`, line: `${route(offered)}, ${shortDate(offered.date)}. All-inclusive. Accept with one tap; nothing to pay until the aircraft is confirmed.` };
  const pay = flights.find((f) => f.steps.pay === "now");
  if (pay) return { kind: "pay", f: pay, title: `Your aircraft is confirmed. Payment: ${money(pay.price!, pay.currency)}`, line: `${route(pay)}, ${shortDate(pay.date)}.${pay.payBy ? ` Due by ${shortDate(pay.payBy)}.` : ""} Bank transfer or card.` };
  const soon = flights.find((f) => f.steps.pax !== "done" && (new Date(f.date).getTime() - today.getTime()) / 864e5 < 14);
  if (soon) return { kind: "pax", f: soon, title: `Add your guests for ${route(soon)}`, line: `Names and a photo of each passport, read automatically. Needed by 24 hours before departure.` };
  const first = flights[0];
  if (!first) return { kind: "plan", title: "Where would you like to go?", line: "Four taps to a recommended cabin and a price. Your advisor takes it from there." };
  if (first.priceState === "estimate") return { kind: "wait", f: first, title: "Nothing to do. Your final price is on its way.", line: `Your advisor sends one final price for ${route(first)} within 2 hours of your request.` };
  if (first.steps.ac !== "done") return { kind: "wait", f: first, title: "Nothing to do. We are confirming your aircraft.", line: `${route(first)}: aircraft and crew confirmed within 2 hours. We tell you as soon as it is done.` };
  return { kind: "wait", f: first, title: "Nothing to do. Everything is in hand.", line: `Next: your flight brief for ${route(first)} arrives 2 days before you fly.` };
}
