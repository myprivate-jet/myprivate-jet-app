/**
 * The five MyPrivate-Jet cabin standards.
 *
 * A standard is a promise about the cabin, not a particular aircraft.
 * Values are prototype values to be approved by MyPrivate-Jet management and
 * qualified operations staff (policy v0.1 §3, §14). Cabin facts are typical of
 * the standard and confirmed per aircraft.
 */
export type StandardId = "reach" | "signature" | "distinction" | "large" | "privilege";

export interface Standard {
  id: StandardId;
  name: string;
  slug: string;
  examples: string;
  maxPax: number;
  /** Nonstop screening distance, km */
  screenKm: number;
  /** Typical cruise speed for block-time estimates, km/h */
  speed: number;
  /** Hours that stay comfortable in this cabin */
  comfortH: number;
  /** Hours beyond which we confirm personally that the cabin suits the client */
  maxH: number;
  height: string;
  standUp: boolean;
  lavatory: string;
  attendant: boolean | "On request";
  hold: string;
  wifi: string;
  skis: boolean;
  line: string;
}

export const STANDARDS: Record<StandardId, Standard> = {
  reach: {
    id: "reach", name: "The Reach", slug: "the-reach", examples: "Pilatus PC-12 NGX, Citation M2",
    maxPax: 6, screenKm: 1500, speed: 500, comfortH: 1.5, maxH: 2.5, height: "1.47 m", standUp: false,
    lavatory: "Not on every aircraft", attendant: false, hold: "Limited", wifi: "On some aircraft", skis: false,
    line: "Small airports and short hops.",
  },
  signature: {
    id: "signature", name: "The Signature", slug: "the-signature", examples: "Phenom 300E, Pilatus PC-24, Citation XLS Gen2",
    maxPax: 7, screenKm: 2800, speed: 750, comfortH: 3, maxH: 4, height: "1.50 m", standUp: false,
    lavatory: "Enclosed", attendant: false, hold: "Good", wifi: "Yes", skis: true,
    line: "The fastest way to cover Europe's short and medium routes.",
  },
  distinction: {
    id: "distinction", name: "The Distinction", slug: "the-distinction", examples: "Challenger 3500, Praetor 600, Gulfstream G280",
    maxPax: 9, screenKm: 5000, speed: 830, comfortH: 5.5, maxH: 7, height: "1.83 m", standUp: true,
    lavatory: "Enclosed, full width", attendant: "On request", hold: "Generous", wifi: "Yes", skis: true,
    line: "Stand-up cabin and a flat floor for longer days.",
  },
  large: {
    id: "large", name: "Grand Cabin", slug: "grand-cabin", examples: "Falcon 2000LXS / 900LX, Challenger 650",
    maxPax: 12, screenKm: 6500, speed: 850, comfortH: 8, maxH: 9, height: "1.88 m", standUp: true,
    lavatory: "Enclosed, with vanity", attendant: true, hold: "Very generous", wifi: "Yes", skis: true,
    line: "Room for a family and a cabin attendant.",
  },
  privilege: {
    id: "privilege", name: "The Privilege", slug: "the-privilege", examples: "Gulfstream G650ER, Global 7500, Falcon 8X",
    maxPax: 14, screenKm: 11000, speed: 900, comfortH: 16, maxH: 14, height: "1.88 to 1.95 m", standUp: true,
    lavatory: "Private, often with shower", attendant: true, hold: "Very generous", wifi: "Yes", skis: true,
    line: "Separate rooms and a bed. Intercontinental nonstop.",
  },
};

export const ORDER: StandardId[] = ["reach", "signature", "distinction", "large", "privilege"];

export const isStandardId = (v: unknown): v is StandardId =>
  typeof v === "string" && (ORDER as string[]).includes(v);
