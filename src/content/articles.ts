/** Educational articles. Short, factual, crawlable: written to be cited. */
export interface Article { slug: string; title: string; description: string; kicker: string; updated: string; body: { h?: string; p: string[] }[] }

export const ARTICLES: Article[] = [
  {
    slug: "why-one-price",
    kicker: "Method",
    title: "Why one Assured Price beats comparing charter quotes",
    description: "On the same private jet trip, the highest operator offer is typically about 1.5 times the cheapest. Here is why we give one final price instead.",
    updated: "2026-11-27",
    body: [
      { p: ["Ask several brokers for the same private flight and the quotes rarely agree. In our record of almost 5,000 priced charter trips across Europe and the United States, the highest operator offer on the same trip was typically about 1.5 times the cheapest.", "That spread is not a bargain waiting to be found. It reflects where aircraft happen to be based, which ones are free that day, and how much risk each operator prices in. Comparing quotes means carrying that uncertainty yourself, and often a second round of questions when the cheapest option falls through."] },
      { h: "What an Assured Price is", p: ["We recommend one cabin standard for your trip and give one final, all-inclusive price: aircraft, crew, positioning, airport fees and catering. It is set from comparable trips at a level that lets us secure an aircraft of that standard in the large majority of cases.", "If no aircraft of the booked standard is available at that price, you are offered a higher standard at the same price, or one new final price to accept or decline with a tap. Declining costs nothing. Nothing is payable until the aircraft is confirmed."] },
      { h: "When the price is confirmed with the aircraft", p: ["For departures within seven days, during peak events such as the Monaco Grand Prix or the Christmas period, and on routes outside our data, the price is confirmed together with the aircraft rather than guaranteed in advance. Your advisor still gives you one figure, not a range."] },
    ],
  },
  {
    slug: "cabin-standards-explained",
    kicker: "Cabins",
    title: "Private jet cabin standards, explained without jargon",
    description: "Cabin height, lavatory, luggage and range: what actually changes between a light jet and an ultra-long-range jet, and how to choose.",
    updated: "2026-11-27",
    body: [
      { p: ["Private jets are usually sold by type name, which tells a traveller very little. What matters on board is whether you can stand, whether the lavatory is enclosed, how much luggage the hold takes and how long the cabin stays comfortable.", "We group aircraft into five standards. Each is a promise about the cabin, not a particular aircraft, so we can always find one that meets it."] },
      { h: "The rule of thumb", p: ["Up to about 90 minutes, a seated cabin is comfortable. Beyond three hours, a stand-up cabin and a flat floor make a real difference. Beyond eight hours, separate rooms and a bed matter more than speed.", "Skis, golf bags and pets change the answer more often than the number of guests. Tell us once in your profile and we apply it to every request."] },
    ],
  },
  {
    slug: "private-jet-door-to-door",
    kicker: "Time",
    title: "Private jet or first class: the door-to-door difference",
    description: "Why a 55-minute private flight often saves two to three hours against an airline, and where the time actually goes.",
    updated: "2026-11-27",
    body: [
      { p: ["Flight time is the smallest part of a short trip. With an airline, security, boarding, taxi queues and baggage typically add two to three hours around the flight. From a private aviation terminal you can usually be airborne about 15 minutes after arriving, and your car often drives to the aircraft.", "Private flights also use smaller airports closer to where you are going: Farnborough or Biggin Hill for London, Le Bourget for Paris, Sion for Verbier."] },
      { h: "Where time is still lost", p: ["Winter de-icing adds 15 to 30 minutes on the ground. Peak weeks at Nice, Ibiza or Olbia need slots and parking reserved with the booking. We build both into your timing so they never become a delay."] },
    ],
  },
  {
    slug: "peak-dates-private-aviation",
    kicker: "Calendar",
    title: "Peak dates in private aviation, and when to book",
    description: "Monaco Grand Prix, Davos, Art Basel Miami Beach, Christmas and the Mediterranean summer: when aircraft become scarce and how early to confirm.",
    updated: "2026-11-27",
    body: [
      { p: ["A handful of weeks each year absorb a large share of private flying in Europe and the United States. During them, aircraft are scarce, airports limit parking, and late requests often fail.", "As a rule, confirm about six weeks ahead for these periods. On peak dates we confirm the price together with the aircraft."] },
    ],
  },
];
export const articleBySlug = (s: string) => ARTICLES.find((a) => a.slug === s);

export const FAQ: [string, string][] = [
  ["Is MyPrivate-Jet a marketplace or a broker?", "Neither in the usual sense. We do not show you lists of operators or competing quotes. As your agent under a simple membership mandate, we recommend one cabin standard, give one final price, contract an audited operator for you and remain your single point of contact."],
  ["What does the Assured Price include?", "Everything for the trip as described: aircraft, crew, positioning of the aircraft, airport and handling fees, standard catering and, on US domestic flights, federal excise taxes."],
  ["When do I pay?", "Only once the aircraft is confirmed, which we aim to do within 2 hours of booking. Payment is due 5 days before departure, by bank transfer or card. You pay MyPrivate-Jet; we pay the operator."],
  ["What if no aircraft is available at that price?", "You get a higher standard at the same price, or one new final price to accept or decline with one tap. If you decline, the booking ends at no cost."],
  ["Is there a membership fee or deposit?", "No. Membership is free: your name, email and mobile, verified by SMS, and one tick to accept the terms and mandate."],
  ["Who operates the flights?", "Licensed air carriers that pass our audit, with aircraft generally 15 years old or newer and crews qualified for the airports involved. The operator keeps final authority over safety."],
  ["Can I speak to a person?", "Always. Your Dedicated Advisor is one message away on every page, before and after you book."],
];
