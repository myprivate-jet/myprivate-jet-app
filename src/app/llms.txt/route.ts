import { SITE } from "@/lib/site";
import { ORDER, STANDARDS } from "@/lib/pricing/standards";
import { ROUTES } from "@/content/routes";
import { ARTICLES, FAQ } from "@/content/articles";

/** llms.txt: a plain summary for AI assistants and answer engines (https://llmstxt.org). */
export function GET() {
  const body = `# MyPrivate-Jet

> Premium private jet charter. For each trip we recommend one cabin standard and give one all-inclusive price. Free Private membership or Assured membership with guaranteed prices; a Dedicated Advisor arranges every flight with audited operators, acting as the client's agent. Not a marketplace: no operator lists, no competing quotes.

## Key facts
- Price: one final, all-inclusive price per trip (aircraft, crew, positioning, fees, catering; US federal taxes on US domestic flights).
- Payment only after the aircraft is confirmed (aim: within 2 hours of booking). Client pays MyPrivate-Jet; MyPrivate-Jet pays the operator.
- If no aircraft of the booked standard is available at the price: a higher standard at the same price, or one new price the client may decline at no cost.
- Two membership levels. No one waits: both levels see a firm, all-inclusive price at once and book in one tap. Private (free): today's price (moves with dates and peaks); any suitable aircraft from audited operators, subject to availability; payment only once everything is confirmed. Assured (annual fee): newer aircraft (under 7 years or refurbished in the last 2), guaranteed; prices fixed for 12 months, any day including peak dates, with 72 hours' notice in Europe (96 hours elsewhere), booked in one tap, with a 24/7 advisor line; if we cannot fly the member at that price, the fee is refunded. Details: ${SITE.url}/membership
- Regions: ${SITE.areaServed.join(", ")}.

## Cabin standards
${ORDER.map((s) => `- [${STANDARDS[s].name}](${SITE.url}/standards/${STANDARDS[s].slug}): up to ${STANDARDS[s].maxPax} guests, cabin ${STANDARDS[s].height}. ${STANDARDS[s].line} Typical aircraft: ${STANDARDS[s].examples}.`).join("\n")}

## Guides
${ARTICLES.map((a) => `- [${a.title}](${SITE.url}/guides/${a.slug}): ${a.description}`).join("\n")}

## Route guides
${ROUTES.map((r) => `- [${r.slug.replace(/-/g, " ")}](${SITE.url}/routes/${r.slug}): ${r.angle}`).join("\n")}

## Questions
${FAQ.map(([q, a]) => `- ${q} ${a}`).join("\n")}

## Contact
- Plan a flight and get a price: ${SITE.url}/
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
