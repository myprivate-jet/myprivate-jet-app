import "server-only";
import raw from "@/data/airports.json";

/** [ICAO, IATA, name, city, country (ISO-2), lat, lon] */
export type Airport = [string, string, string, string, string, number, number];

const AIRPORTS = raw as Airport[];
const BY_ICAO = new Map(AIRPORTS.map((a) => [a[0], a]));

export function airport(icao: string): Airport | undefined {
  return BY_ICAO.get(icao.toUpperCase());
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Ranked search for the airport picker: codes first, then city, then name. */
export function searchAirports(q: string, limit = 8): Airport[] {
  const n = norm(q.trim());
  if (n.length < 2) return [];
  const scored: [number, Airport][] = [];
  for (const a of AIRPORTS) {
    let s = 0;
    if (a[0].toLowerCase() === n || a[1].toLowerCase() === n) s = 100;
    else if (norm(a[3]).startsWith(n)) s = 60;
    else if (norm(a[2]).startsWith(n)) s = 50;
    else if (norm(a[3]).includes(n) || norm(a[2]).includes(n)) s = 20;
    if (s) {
      // Prefer airports with an IATA code (larger, jet-capable) at equal match.
      if (a[1]) s += 5;
      scored.push([s, a]);
    }
  }
  return scored.sort((x, y) => y[0] - x[0]).slice(0, limit).map((x) => x[1]);
}

export const cityOf = (icao: string) => {
  const a = airport(icao);
  return a ? a[3] || a[2] : icao;
};
