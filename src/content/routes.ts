/** Route guides: one indexable page per popular corridor. Add rows to publish more. */
/** fromName/toName: the place people search for, when it differs from the airport town. */
export const ROUTES: { from: string; to: string; slug: string; angle: string; fromName?: string; toName?: string }[] = [
  { from: "LSGG", to: "LFMN", slug: "geneva-to-nice", angle: "The Riviera in under an hour, with Monaco 7 minutes on by helicopter." },
  { from: "LFPB", to: "LFMN", slug: "paris-to-nice", angle: "Le Bourget to the Côte d'Azur, door to door in about two and a half hours." },
  { fromName: "London", from: "EGLF", to: "LSGG", slug: "london-to-geneva", angle: "Farnborough to Geneva for the Alps, the lake and the banks." },
  { fromName: "London", from: "EGLF", to: "LEIB", slug: "london-to-ibiza", angle: "A summer corridor where slots and parking decide everything." },
  { from: "LFPB", to: "LGMK", slug: "paris-to-mykonos", angle: "Paris to the Cyclades in a stand-up cabin." },
  { fromName: "London", from: "EGLF", to: "LSGS", toName: "Sion (Verbier)", slug: "london-to-sion", angle: "The closest jet airport to Verbier, with a valley approach only trained crews fly." },
  { from: "LSGG", to: "EGLF", toName: "London", slug: "geneva-to-london", angle: "From the lake to London's business-aviation-only airport." },
  { from: "LFPB", to: "LSGG", slug: "paris-to-geneva", angle: "Just over an hour from Le Bourget to Geneva's private terminal." },
  { fromName: "New York", from: "KTEB", to: "KPBI", slug: "new-york-to-palm-beach", angle: "Teterboro to Palm Beach, the busiest winter corridor in the US." },
  { fromName: "New York", from: "KTEB", to: "KASE", slug: "new-york-to-aspen", angle: "Mountain flying at 2,383 m, planned with a backup before you leave." },
  { fromName: "London", from: "EGLF", to: "KTEB", toName: "New York", slug: "london-to-new-york", angle: "Transatlantic nonstop in a cabin with a bed." },
  { from: "LFPB", to: "LIEO", slug: "paris-to-olbia", angle: "The Costa Smeralda, where summer parking fills days ahead." },
];

export const routeBySlug = (s: string) => ROUTES.find((r) => r.slug === s);
