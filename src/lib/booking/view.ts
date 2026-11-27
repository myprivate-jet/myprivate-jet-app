import { clientSteps, type ClientStepKey, type StepState } from "./stages";
import { clientBrief } from "./brief";

/** Everything the client Office needs about one flight. Never contains operator costs or offers. */
export interface ClientFlight {
  ref: string;
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  pax: number;
  standardName: string;
  ret: boolean;
  price: number | null;
  currency: string;
  stage: number;
  steps: Record<ClientStepKey, StepState>;
  payBy: string | null;
  aircraft: string | null;
  names: string[];
  passports: boolean[];
  keep: boolean;
  note: string | null;
  brief: Record<string, string> | null;
  guarantee: "estimate" | "instant" | "with-aircraft";
  /** Private requests: the estimate shown when the client asked. */
  estimate: number | null;
  /** estimate: waiting for the advisor's final price; offered: final price to accept; fixed: accepted, never moves. */
  priceState: "estimate" | "offered" | "fixed";
  declined: boolean;
}

export function toClientFlight(
  b: { ref: string; date: string; time: string; pax: number; returnDate: string | null; price: number | null; currency: string; stage: number; payBy: string | null; aircraft: string | null; keepPassports: boolean; advisorNote: string | null; guarantee: "estimate" | "instant" | "with-aircraft"; estimate: number | null; priceAcceptedAt: Date | null; needsAdvisor: string | null; passengers: { seat: number; fullName: string | null; passportStatus: string }[]; paxComplete: boolean; briefSent: boolean; briefFields: Record<string, string> | null },
  fromCity: string,
  toCity: string,
  standardName: string,
): ClientFlight {
  const names = Array.from({ length: b.pax }, (_, i) => b.passengers.find((p) => p.seat === i + 1)?.fullName ?? "");
  const passports = Array.from({ length: b.pax }, (_, i) => b.passengers.find((p) => p.seat === i + 1)?.passportStatus === "read");
  const priceState = b.priceAcceptedAt ? "fixed" : b.price != null ? "offered" : "estimate";
  return {
    ref: b.ref, fromCity, toCity, date: b.date, time: b.time, pax: b.pax, standardName, ret: Boolean(b.returnDate),
    price: b.price, currency: b.currency, stage: b.stage, steps: clientSteps(b.stage, b.paxComplete, b.briefSent, priceState === "fixed"),
    payBy: b.payBy, aircraft: b.stage > 4 ? b.aircraft : null, names, passports, keep: b.keepPassports, note: b.advisorNote,
    brief: b.briefFields ? clientBrief(b.briefFields) : null, guarantee: b.guarantee,
    estimate: b.estimate, priceState, declined: b.needsAdvisor === "Client declined the final price",
  };
}
