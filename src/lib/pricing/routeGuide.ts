import "server-only";
import { airport } from "./airports";
import { hm, makeTrip, quote } from "./engine";
import { AIRPORT_NOTES, EVENTS } from "./knowledge";
import { STANDARDS } from "./standards";

/** Facts for an indexable route guide, computed from the same engine as the app. */
export function routeFacts(from: string, to: string) {
  const a = airport(from), b = airport(to);
  if (!a || !b) return null;
  const d = new Date(Date.now() + 60 * 864e5);
  const date = d.toISOString().slice(0, 10);
  const t = makeTrip({ from, to, date, time: "10:00", pax: 4, ret: false, bags: "std", standUp: false, attendant: false, pets: false }, a, b);
  const q = quote(t);
  const s = q.shown ?? q.advisorStandard;
  return {
    a, b, km: Math.round(t.km), q,
    standard: s ? STANDARDS[s] : null,
    price: q.shown ? q.standards[q.shown].price : null,
    hours: s ? hm(q.standards[s].hrs) : null,
    notes: [a[0], b[0]].filter((c) => AIRPORT_NOTES[c]).map((c) => ({ city: airport(c)![3], text: AIRPORT_NOTES[c] })),
    events: EVENTS.filter((e) => e.airports?.some((x) => x === a[0] || x === b[0])).map((e) => e.name),
    asOf: new Date().toISOString().slice(0, 10),
  };
}
