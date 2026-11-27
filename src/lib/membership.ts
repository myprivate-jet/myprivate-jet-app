/**
 * The two membership levels (decided 2026-11-27). The Assured fee is a proposal until approved.
 * Shared by the public page, the price card, the Office and llms.txt, so the promise reads the same everywhere.
 */
export const ASSURED_FEE = { amount: 15000, currency: "EUR", label: "€15,000 a year", status: "proposal" as const };

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
      "If we cannot fly you at that price, your annual fee comes back",
      "A 24/7 line to your Dedicated Advisor",
    ],
  },
} as const;

export type Level = keyof typeof LEVELS;
