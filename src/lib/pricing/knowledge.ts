/**
 * Educational knowledge: every request teaches the client something.
 * Checked public facts; to be reviewed by MyPrivate-Jet operations.
 */

export interface PeakEvent {
  name: string;
  /** ICAO codes; null = all regions */
  airports: string[] | null;
  /** MM-DD, may wrap over the new year */
  from: string;
  to: string;
}

/** Busy periods: usual windows, to be confirmed each year. */
export const EVENTS: PeakEvent[] = [
  { name: "Monaco Grand Prix weekend", airports: ["LFMN", "LFMD", "LFTZ"], from: "05-20", to: "06-01" },
  { name: "Cannes Film Festival", airports: ["LFMN", "LFMD"], from: "05-10", to: "05-25" },
  { name: "World Economic Forum in Davos", airports: ["LSZH", "LSZS", "LSZR", "LSGS"], from: "01-14", to: "01-26" },
  { name: "Art Basel Miami Beach", airports: ["KMIA", "KOPF", "KFLL", "KTMB"], from: "12-01", to: "12-09" },
  { name: "Abu Dhabi Grand Prix", airports: ["OMAA", "OMAD"], from: "11-25", to: "12-08" },
  { name: "the Christmas and New Year peak", airports: null, from: "12-18", to: "01-04" },
  { name: "the Mediterranean summer peak", airports: ["LEIB", "LEPA", "LGMK", "LGSR", "LIEO", "LFKJ", "LFMN", "LFMD", "LFTZ", "LDDU", "LDSP"], from: "07-01", to: "08-31" },
  { name: "the Alpine ski peak", airports: ["LSGS", "LSZS", "LFLB", "LFLS", "LOWI", "LOWS", "LSGG", "LSZH", "LIMA"], from: "02-01", to: "03-08" },
];

/** One airport fact per request: something a client would not know. */
export const AIRPORT_NOTES: Record<string, string> = {
  LFMN: "Nice is one of Europe's busiest business-aviation airports. In peak weeks parking is limited and slots are needed, which we secure with the booking. Monaco is about 7 minutes away by helicopter.",
  LFMD: "Cannes-Mandelieu has a short runway of about 1,600 m and a noise curfew, so only lighter jets land there. Larger cabins use Nice, 30 minutes away by car.",
  LFLJ: "Courchevel's runway is 537 m long with an 18% slope. No jet can land there, and only specially trained pilots fly in. Jets use Chambéry or Geneva, with a car or helicopter onwards.",
  LSGS: "Sion sits in a narrow Alpine valley. Crews need specific training for its approach, so we book only operators qualified for it. It is the closest jet airport to Verbier and Crans-Montana.",
  LSZS: "Samedan, for St. Moritz, is the highest airport in Europe at 1,707 m. Only specially approved crews may fly in, and thin air limits how much a jet can carry on departure.",
  KASE: "Aspen sits at 2,383 m with mountains close on every side. Larger jets face wingspan and weight limits, and winter weather sends flights to Eagle County, 1 h 40 by car. We plan a backup before you leave.",
  KTEB: "Teterboro is the closest jet airport to Manhattan, about 20 minutes away outside rush hour. It limits aircraft weight, so the largest cabins use Westchester or Newark instead.",
  EGLC: "London City has a steep approach that only specially certified aircraft may fly, so few cabin standards can use it. Farnborough and Biggin Hill take any jet, 45 to 60 minutes from central London.",
  EGLF: "Farnborough is a business-aviation-only airport: no airline queues, and your car drives to the terminal door. Central London is about an hour away.",
  TFFJ: "St Barth's runway is 650 m long, between a hill and the beach. No jet lands there. Your jet flies to St Maarten, and a short turboprop or helicopter hop completes the trip.",
  LIEO: "Olbia serves the Costa Smeralda. In July and August aircraft parking fills days ahead, which is why we confirm parking with the aircraft.",
  LEIB: "Ibiza's private aviation terminal saturates in July and August. Slots and parking are reserved with the booking, never on the day.",
  LSGG: "Geneva has a dedicated private aviation terminal, and you can be airborne about 15 minutes after reaching it.",
  KPBI: "Palm Beach is busiest from January to April. Winter weekends need early booking, because aircraft flow south from the northeast.",
  OMDB: "Dubai International handles business jets at its own terminal, but slots are scarce at peak hours. Al Maktoum (DWC) is often smoother for private flights.",
};

export function eventFor(date: string, airports: string[]): PeakEvent | null {
  if (!date) return null;
  const md = date.slice(5);
  const inWin = (f: string, t: string) => (f <= t ? md >= f && md <= t : md >= f || md <= t);
  return EVENTS.find((e) => inWin(e.from, e.to) && (!e.airports || airports.some((a) => e.airports!.includes(a)))) ?? null;
}

/** Upcoming peak periods from a given day, soonest first. */
export function nextEvents(from = new Date()) {
  const now = new Date(from);
  now.setHours(0, 0, 0, 0);
  const y = now.getFullYear();
  const out: { event: PeakEvent; start: Date; end: Date }[] = [];
  for (const e of EVENTS) {
    for (const yy of [y, y + 1]) {
      const start = new Date(`${yy}-${e.from}T00:00:00`);
      let end = new Date(`${yy}-${e.to}T00:00:00`);
      if (end < start) end = new Date(`${yy + 1}-${e.to}T00:00:00`);
      if (end >= now) {
        out.push({ event: e, start, end });
        break;
      }
    }
  }
  return out.sort((a, b) => +a.start - +b.start);
}
