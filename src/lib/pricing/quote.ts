import "server-only";
import { z } from "zod";
import { airport } from "./airports";
import { makeTrip, quote, type Tier, type Trip } from "./engine";
import { isStandardId, type StandardId } from "./standards";

export const tripSchema = z.object({
  from: z.string().min(3).max(4),
  to: z.string().min(3).max(4),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/).default("10:00"),
  pax: z.coerce.number().int().min(1).max(19),
  ret: z.coerce.boolean().default(false),
  rdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  bags: z.enum(["std", "ski", "golf", "large"]).default("std"),
  standUp: z.coerce.boolean().default(false),
  attendant: z.coerce.boolean().default(false),
  pets: z.coerce.boolean().default(false),
  pick: z.string().optional().nullable(),
});
export type TripRequest = z.infer<typeof tripSchema>;

export function buildTrip(req: TripRequest): Trip | null {
  const a = airport(req.from);
  const b = airport(req.to);
  if (!a || !b || a === b) return null;
  return makeTrip({ ...req, rdate: req.rdate || undefined }, a, b);
}

export function quoteFor(req: TripRequest, tier: Tier = "guest") {
  const t = buildTrip(req);
  if (!t) return null;
  const pick: StandardId | null = isStandardId(req.pick) ? req.pick : null;
  return quote(t, pick, new Date(), tier);
}
