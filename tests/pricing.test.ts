import { describe, expect, it } from "vitest";
import raw from "@/data/airports.json";
import { makeTrip, price, quote, recommend, screenAll, type TripInput } from "@/lib/pricing/engine";
import type { Airport } from "@/lib/pricing/airports";
import type { StandardId } from "@/lib/pricing/standards";

const IDX = new Map((raw as Airport[]).map((a) => [a[0], a]));
const trip = (from: string, to: string, extra: Partial<TripInput> = {}) =>
  makeTrip({ from, to, date: "2027-06-11", time: "10:00", pax: 4, ret: false, bags: "std", standUp: false, attendant: false, pets: false, ...extra }, IDX.get(from)!, IDX.get(to)!);

describe("Assured Price parity with the approved prototype", () => {
  // Expected values computed by running the prototype's own price() on the same inputs.
  const cases: [string, string, boolean, number, StandardId, number, number][] = [
    ["LSGG", "LFMN", false, 4, "signature", 12600, 0],
    ["LFPB", "LSGG", true, 4, "distinction", 34600, 0],
    ["KTEB", "KPBI", false, 6, "distinction", 48400, 3402],
    ["EGLF", "KTEB", false, 8, "privilege", 183600, 0],
    ["LSGG", "LEIB", false, 3, "reach", 16600, 0],
    ["KTEB", "KASE", true, 5, "large", 136100, 9541],
  ];
  it.each(cases)("%s-%s ret=%s pax=%i %s", (f, t, ret, pax, s, assured, tax) => {
    const p = price(s, trip(f, t, { ret, pax }));
    expect(p.assured).toBe(assured);
    expect(p.tax).toBe(tax);
  });
});

describe("recommendation and screening", () => {
  it("recommends one priced standard for Geneva to Nice", () => {
    const t = trip("LSGG", "LFMN");
    const s = recommend(t, screenAll(t));
    expect(s).toBe("reach");
  });
  it("excludes standards that cannot seat the party", () => {
    const R = screenAll(trip("LSGG", "LFMN", { pax: 10 }));
    expect(R.reach.st).toBe("off");
    expect(R.signature.st).toBe("off");
    expect(R.distinction.st).toBe("off");
  });
  it("sends cross-region trips to the advisor and never shows a range", () => {
    const q = quote(trip("EGLF", "OMDB"));
    expect(q.shown).toBeNull();
    expect(q.advisorStandard).not.toBeNull();
    expect(JSON.stringify(q)).not.toContain("quantiles");
  });
  it("shows guests and Private members an estimate, never a guarantee", () => {
    const early = new Date("2027-01-10T09:00:00Z");
    expect(quote(trip("LSGG", "LFMN"), null, early).guarantee).toBe("estimate");
    expect(quote(trip("LSGG", "LFMN"), null, early, "private").guarantee).toBe("estimate");
  });
  it("guarantees the Assured price any day, peak dates included, outside the notice period", () => {
    // 11 June 2027 is in the peak calendar; Assured is still guaranteed.
    expect(quote(trip("LSGG", "LFMN"), null, new Date("2027-06-08T09:00:00Z"), "assured").guarantee).toBe("instant");
    // Inside 72 hours in Europe: confirmed with the aircraft.
    expect(quote(trip("LSGG", "LFMN"), null, new Date("2027-06-09T09:00:00Z"), "assured").guarantee).toBe("with-aircraft");
    // Outside Europe the notice is 96 hours.
    const us = quote(trip("KTEB", "KPBI"), null, new Date("2027-06-07T20:00:00Z"), "assured");
    expect(us.notice).toBe(96);
    expect(us.guarantee).toBe("with-aircraft");
  });
});
