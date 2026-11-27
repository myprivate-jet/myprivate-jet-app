/**
 * The two membership levels (decided 2026-11-27). Fee and 96-hour notice approved by Pascal 2026-11-27;
 * the fee-back wording is still being finalised (FEE_BACK.status).
 * Shared by the public page, the price card, the Office and llms.txt, so the promise reads the same everywhere.
 */
export const ASSURED_FEE = { amount: 15000, currency: "EUR", label: "€15,000 a year", status: "approved" as const };

/** The fee-back promise in plain words. Wording awaiting final approval. */
export const FEE_BACK = {
  status: "draft" as const,
  short: "If we ever fail you, the whole year's fee comes back",
  text: "If, on any request made with the required notice, we cannot fly you in your standard at your Assured Price, your whole annual fee is refunded: in money, not as a credit. And we still find you an aircraft, at one new price you are free to decline.",
};

export const LEVELS = {
  private: {
    name: "Private",
    price: "Free",
    line: "An honest estimate at once, then one final price from your advisor within 2 hours.",
    points: [
      "The recommended cabin and what to know about your trip, instantly",
      "An estimated all-inclusive price, clearly marked as an estimate",
      "One final price from your Dedicated Advisor within 2 hours",
      "Accept with one tap: from then on the price is fixed",
      "Nothing to pay until the aircraft is confirmed",
    ],
  },
  assured: {
    name: "Assured",
    price: ASSURED_FEE.label,
    line: "The price you see is the price you pay. Book in one tap, any day of the year.",
    points: [
      "The price on screen is guaranteed, not an estimate",
      "Prices fixed for 12 months, peak dates included",
      "Book in one tap with 72 hours' notice in Europe (96 hours elsewhere)",
      "If we ever fail you, the whole year's fee comes back",
      "A 24/7 line to your Dedicated Advisor",
    ],
  },
} as const;

export type Level = keyof typeof LEVELS;
