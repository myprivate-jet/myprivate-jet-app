/**
 * Membership Terms, mandate and booking terms.
 * DRAFT wording, pending legal review (agency, client money, mandate, data protection).
 */
export const TERMS_VERSION = "2026-11-27-draft";

export const MANDATE_POINTS = [
  "You book; we contract. When you press Book, we arrange the flight with a qualified operator for you.",
  "We sign the charter agreement in your name, only for the trip, date and price you confirmed.",
  "You pay MyPrivate-Jet; we pay the operator. You never deal with operators.",
  "The operator keeps final authority over safety, as the law requires.",
  "You can withdraw the mandate at any time. Flights already booked continue.",
];

export const MANDATE_TICK =
  "I accept the Membership Terms, including a mandate for MyPrivate-Jet to contract the flights I book and to sign their charter agreements on my behalf.";

export const BOOKING_TERMS: [string, string][] = [
  ["Booking and confirmation", "A booking is your instruction to us. Your price is guaranteed once we confirm the aircraft, which we aim to do within 2 hours. Nothing is payable before."],
  ["Confirmed or free", "If no aircraft of the booked standard is available at the Assured Price, we either offer a higher standard at the same price, or propose one new final price for you to accept or decline with one tap. If you decline, the booking ends at no cost to either side."],
  ["Short notice and peak dates", "For departures within 7 days, during listed peak events, or on routes priced by your advisor, the price is confirmed together with the aircraft and is not guaranteed in advance."],
  ["Price validity", "A displayed price is valid for 24 hours and only for the trip as described: date, time, airports, guests and luggage."],
  ["Payment", "Payment is due 5 days before departure, or immediately for flights within 5 days. A flight not paid in cleared funds may be cancelled, and clause 7 then applies."],
  ["Replacement after confirmation", "If the operator cannot perform, we arrange a replacement of the same or higher standard at our cost, up to 25% of the price paid. If no replacement is available, we refund the full price."],
  ["Cancellation by you", "Free until the aircraft is confirmed. After that: 20% of the price up to 14 days before departure, 50% up to 72 hours before, 100% within 72 hours."],
  ["Changes", "Changes are free when the operator does not charge for them. Otherwise we give you one new final price to accept or decline."],
  ["Events outside our control", "Weather, air traffic control, airport closures, strikes, security, sanctions, public-health measures and the captain's safety decisions are outside our control. Delays are not compensated. If the flight cannot operate, we rebook it or refund the price less the operator's non-recoverable costs."],
  ["Your declarations", "Guests, luggage, pets and travel documents must be as declared. Extra costs caused by an inaccurate declaration are charged at cost, and the operator may refuse carriage."],
  ["Our role and liability", "We act as your agent under your mandate. The operator is the air carrier and has final authority over safety. Our total liability is limited to the price paid for the flight concerned, and excludes indirect or consequential loss."],
];
