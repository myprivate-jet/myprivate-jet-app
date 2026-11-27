/** The 12-stage booking pipeline. 9 of 12 run without the advisor. */
export const STAGES = [
  { key: "req", name: "Request received", who: "Auto" },
  { key: "price", name: "Priced", who: "Auto" },
  { key: "book", name: "Booked by client", who: "Client" },
  { key: "src", name: "Sourcing", who: "Auto" },
  { key: "ac", name: "Aircraft chosen", who: "Advisor" },
  { key: "agr", name: "Agreement signed", who: "Auto" },
  { key: "pin", name: "Client paid", who: "Client" },
  { key: "pout", name: "Operator paid", who: "Advisor" },
  { key: "pax", name: "Passengers", who: "Client" },
  { key: "brief", name: "Brief sent", who: "Auto" },
  { key: "fly", name: "Flown", who: "Ops" },
  { key: "close", name: "Closed", who: "Auto" },
] as const;
export type StageKey = (typeof STAGES)[number]["key"];
export const stageIndex = (k: StageKey) => STAGES.findIndex((s) => s.key === k);

export const STAGE_DESCRIPTIONS: Record<StageKey, string> = {
  req: "Received in the app. Profile, preferences and travellers attached automatically.",
  price: "Assured Price computed (P90 of comparable trips) and eligibility screened.",
  book: "Client pressed Book. Mandate on file, so no signature is needed from the client.",
  src: "RFQ sent automatically to operators qualified for this standard, with our Assured Price as the cost ceiling: audit on file, aircraft 15 years or newer, crew qualified for the airports. Offers ranked on arrival.",
  ac: "Advisor picks the aircraft. The system pre-selects the best audited offer under the cost cap.",
  agr: "Charter agreement generated from the operator's terms and e-signed under the client's mandate the moment an offer is chosen.",
  pin: "Payment link sent automatically. Bank feed reconciles the transfer; reminder at T-7 days.",
  pout: "Operator invoice matched to the agreement. Payment released on one advisor approval.",
  pax: "Names and passport scans added by the client in the app. Details read automatically (MRZ), checked for expiry, and sent securely to the operator and for border filings.",
  brief: "Built at T-48 h from operator data, FBO, weather and client preferences, then sent to client and crew.",
  fly: "Departure and arrival times captured automatically from flight tracking.",
  close: "Invoice and receipt sent, feedback requested, margin booked, preferences updated.",
};

/** The client sees 7 steps; only two are theirs (payment and passengers). */
export const CLIENT_STEPS = [
  { key: "book", name: "Booked" },
  { key: "ac", name: "Aircraft and crew confirmed" },
  { key: "agr", name: "Charter agreement signed for you" },
  { key: "pay", name: "Payment" },
  { key: "pax", name: "Passengers and passports" },
  { key: "brief", name: "Flight brief" },
  { key: "fly", name: "Flown" },
] as const;
export type ClientStepKey = (typeof CLIENT_STEPS)[number]["key"];
export type StepState = "done" | "now" | "todo";

export function clientSteps(stage: number, paxComplete: boolean, briefSent: boolean): Record<ClientStepKey, StepState> {
  const at = (i: number): StepState => (stage > i ? "done" : stage === i ? "now" : "todo");
  return {
    book: stage >= 1 ? "done" : "now",
    ac: at(4) === "todo" && stage >= 1 ? "now" : at(4),
    agr: stage > 5 ? "done" : "todo",
    pay: stage > 6 ? "done" : stage === 6 ? "now" : "todo",
    pax: paxComplete ? "done" : stage >= 1 ? "now" : "todo",
    brief: briefSent || stage > 9 ? "done" : "todo",
    fly: stage > 10 ? "done" : "todo",
  };
}
