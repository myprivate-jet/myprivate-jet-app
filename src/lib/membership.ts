/**
 * The two membership levels (decided 2026-11-27). Fee, 96-hour notice and fee-back wording approved by Pascal 2026-11-27,
 * pending legal review of the Membership Terms.
 * Shared by the public page, the price card, the Office and llms.txt, so the promise reads the same everywhere.
 */
export const ASSURED_FEE = { amount: 15000, currency: "EUR", label: "€15,000 a year", status: "approved" as const };

/** The fee-back promise in plain words. Approved 2026-11-27; legal review pending. */
export const FEE_BACK = {
  status: "approved" as const,
  short: "If we ever fail you, the whole year's fee comes back",
  text: "If, on any request made with the required notice, we cannot fly you in your standard at your Assured Price, your whole annual fee is refunded: in money, not as a credit. And we still find you an aircraft, at one new price you are free to decline.",
};

/**
 * Both levels get a firm price at once and book in one tap: no one waits (decided 2026-11-27).
 * The difference is what is guaranteed: the aircraft, its age, and whether the price moves with the calendar.
 */
export const LEVELS = {
  private: {
    name: "Private",
    price: "Free",
    line: "Today's price, at once. Book in one tap. Any suitable aircraft, subject to availability.",
    points: [
      "A firm, all-inclusive price on screen at once: no estimate, no waiting",
      "Book in one tap; we confirm your aircraft within 2 hours",
      "Any suitable aircraft in your cabin, from audited operators, subject to availability",
      "Today's price: it moves with the date and with peak days",
      "Nothing to pay until everything is confirmed",
    ],
  },
  assured: {
    name: "Assured",
    price: ASSURED_FEE.label,
    line: "Your aircraft guaranteed, your prices fixed for 12 months, any day of the year.",
    points: [
      "Newer aircraft: built in the last 7 years, or refurbished in the last 2",
      "The aircraft is guaranteed with 72 hours' notice in Europe (96 hours elsewhere)",
      "Prices fixed for 12 months, peak days included",
      "If we ever fail you, the whole year's fee comes back",
      "A 24/7 line to your Dedicated Advisor",
    ],
  },
} as const;

export type Level = keyof typeof LEVELS;
