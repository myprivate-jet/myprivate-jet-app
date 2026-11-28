import "server-only";
import { AIRPORT_NOTES } from "@/lib/pricing/knowledge";
import { airport, cityOf } from "@/lib/pricing/airports";
import { haversineKm, hm } from "@/lib/pricing/engine";
import { STANDARDS, type StandardId } from "@/lib/pricing/standards";
import { STAGES } from "@/lib/booking/stages";
import type { bookingDetail, pipeline } from "@/server/queries";

type Pipe = Awaited<ReturnType<typeof pipeline>>;
type Detail = NonNullable<Awaited<ReturnType<typeof bookingDetail>>>;

export function bookingContext(d: Detail) {
  const b = d.booking;
  const p = d.profile as Record<string, string>;
  return [
    `${b.ref}: ${cityOf(b.fromIcao)} (${b.fromIcao}) to ${cityOf(b.toIcao)} (${b.toIcao}), ${b.date} at ${b.time}, ${b.pax} guests, standard ${b.upgradedTo ?? b.standard}.`,
    `Stage: ${STAGES[b.stage]?.name}. Price: ${b.price ?? "to be set"} ${b.currency}. Operator: ${b.operatorName ?? "not chosen"}, aircraft: ${b.aircraft ?? "-"}.`,
    `Passengers named: ${b.passengers.filter((x) => x.fullName).length}/${b.pax}; passports read: ${b.passengers.filter((x) => x.passportStatus === "read").length}/${b.pax}.`,
    `Client preferences: drinks ${p.drinks ?? "-"}; diet ${p.diet ?? "-"}; catering ${p.cater ?? "-"}; pet ${p.pet ?? "-"}.`,
    `Flags: ${b.flags.join("; ") || "none"}.`,
    `Brief fields: ${JSON.stringify(d.brief?.fields ?? {})}`,
  ].join("\n");
}

/** Rule-based answers used until an AI key is configured. */
export function opsFallbackAnswer(q: string, list: Pipe, sel: Detail | null): string {
  const s = q.toLowerCase();
  const ref = (q.match(/MPJ-\d{4}[A-Z]?/i) || [])[0];
  const b = ref ? list.find((x) => x.ref.toLowerCase() === ref.toLowerCase()) : sel?.booking ? list.find((x) => x.ref === sel.booking.ref) : undefined;
  if (/today|need|open|priorit/.test(s)) {
    const n = list.filter((x) => x.needsAdvisor);
    return `${n.length} thing${n.length === 1 ? "" : "s"} need you:\n` + n.map((x) => `• ${x.ref} (${x.client}, ${x.fromIcao}–${x.toIcao}): ${x.needsAdvisor}${x.sla ? `, ${x.sla}` : ""}`).join("\n") + "\nEverything else is running automatically.";
  }
  if (/weather|notam|metar|taf/.test(s)) return `Live weather (METAR/TAF) and NOTAMs need a data feed, which isn't connected yet. Once it is, I summarise them for ${b ? b.fromIcao + " and " + b.toIcao : "each airport"} at 48 h, 24 h and 3 h before departure and alert you to closures, runway works, low visibility and de-icing.`;
  if (/duty|crew/.test(s) && b) {
    const a = airport(b.fromIcao), z = airport(b.toIcao);
    const ft = a && z ? haversineKm(a, z) / STANDARDS[b.standard as StandardId].speed + 0.3 : 0;
    return `${b.ref}: about ${hm(ft)} in the air, so a crew duty day of about ${hm(ft + 1.5)} including briefing and turnaround. Crew duty limits are the operator's legal responsibility (EASA or FAA rules); I flag same-day returns longer than about 10 hours, or overnight waits needing crew rest.`;
  }
  if (/permit/.test(s)) return "Within the EU and Switzerland, an EU-licensed operator normally needs no traffic permit. Elsewhere the operator or its handling agent files permits; I track them as a checklist item and alert you if one isn't confirmed 72 h before departure. (To be confirmed per route with the operator.)";
  const ap = Object.keys(AIRPORT_NOTES).find((k) => s.includes(k.toLowerCase()) || s.includes(cityOf(k).toLowerCase()));
  if (ap) return `${cityOf(ap)} (${ap}): ${AIRPORT_NOTES[ap]}`;
  if (/brief|status|summar|booking/.test(s) && b) {
    return `${b.ref} · ${b.client} · ${cityOf(b.fromIcao)} to ${cityOf(b.toIcao)}, ${b.date} at ${b.time}, ${b.pax} guests, ${STANDARDS[(b.upgradedTo ?? b.standard) as StandardId]?.name}.\nStage: ${STAGES[b.stage]?.name}. ${b.needsAdvisor ? "Needs you: " + b.needsAdvisor + "." : "Next: " + (b.waitingOn ?? "automatic") + "."}\nPassengers: ${b.passengers.filter((x) => x.fullName).length} of ${b.pax} named.${b.flags.length ? `\nWatch: ${b.flags.join("; ")}.` : ""}`;
  }
  return `Connect an AI key and I answer anything about your bookings, operator mail and briefs. For now try: "What needs me today?", "Brief me on this booking", "Notes for Sion", "Weather and NOTAMs", "Crew duty check".`;
}
