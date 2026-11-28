import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ROUTES, routeBySlug } from "@/content/routes";
import { routeFacts } from "@/lib/pricing/routeGuide";
import { money } from "@/lib/format";
import { Crumbs } from "@/components/Crumbs";
import { JsonLd } from "@/components/JsonLd";
import { PlanFlight } from "@/components/PlanFlight";
import { currentMember } from "@/server/auth/session";
import { getDict } from "@/i18n/server";
import { SITE } from "@/lib/site";

export const generateStaticParams = () => ROUTES.map((r) => ({ slug: r.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = routeBySlug((await params).slug);
  const f0 = r && routeFacts(r.from, r.to);
  const f = r && f0 ? { ...f0, a: [...f0.a] as typeof f0.a, b: [...f0.b] as typeof f0.b } : null;
  if (r && f) { if (r.fromName) f.a[3] = r.fromName; if (r.toName) f.b[3] = r.toName; }
  if (!r || !f) return {};
  const title = `${f.a[3]} to ${f.b[3]} by private jet`;
  const description = `${f.hours ? `About ${f.hours} in the air` : `${f.km} km`}. ${f.standard ? `We recommend ${f.standard.name}` : "Priced personally"}${f.price ? `, from ${money(f.price, f.q.trip.cur)} one way for 4 guests, all-inclusive` : ""}. ${r.angle}`;
  return { title, description, alternates: { canonical: `/routes/${r.slug}` }, openGraph: { title, description } };
}

export default async function RoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const r = routeBySlug((await params).slug);
  const f0 = r && routeFacts(r.from, r.to);
  const f = r && f0 ? { ...f0, a: [...f0.a] as typeof f0.a, b: [...f0.b] as typeof f0.b } : null;
  if (r && f) { if (r.fromName) f.a[3] = r.fromName; if (r.toName) f.b[3] = r.toName; }
  if (!r || !f) notFound();
  const [member, { t }] = await Promise.all([currentMember(), getDict()]);
  const faq: [string, string][] = [
    [`How long is the private flight from ${f.a[3]} to ${f.b[3]}?`, `About ${f.hours ?? "a few hours"} in the air for ${f.km.toLocaleString("en-GB")} km, nonstop.`],
    [`How much does a private jet from ${f.a[3]} to ${f.b[3]} cost?`, f.price ? `For 4 guests one way about two months ahead, our Assured Price in ${f.standard!.name} is ${money(f.price, f.q.trip.cur)}, final and all-inclusive (as of ${f.asOf}). Your own date, time, party and luggage give your exact price at once.` : "This route is priced personally by your Dedicated Advisor, who replies with one final price within 2 hours."],
    ["Which airports do private jets use?", `${f.a[2]} (${f.a[0]}) and ${f.b[2]} (${f.b[0]}). Your advisor may suggest a closer or less congested alternative for your exact destination.`],
  ];
  return (
    <>
      <div className="article">
        <Crumbs items={[["/", "Home"], ["/guides", "Guides"], [`/routes/${r.slug}`, `${f.a[3]} to ${f.b[3]}`]]} />
        <h1>{f.a[3]} to {f.b[3]} by private jet</h1>
        <p className="lede">{r.angle}</p>
        <dl className="kv">
          <dt>In the air</dt><dd>About {f.hours}, {f.km.toLocaleString("en-GB")} km nonstop</dd>
          <dt>We recommend</dt><dd>{f.standard ? `${f.standard.name}: ${f.standard.line}` : "Priced personally by your advisor"}</dd>
          <dt>Assured Price</dt><dd>{f.price ? `${money(f.price, f.q.trip.cur)} one way, 4 guests, final and all-inclusive (indicative as of ${f.asOf}, about 60 days ahead)` : "One final price from your advisor within 2 hours"}</dd>
          <dt>Airports</dt><dd>{f.a[2]} ({f.a[0]}) to {f.b[2]} ({f.b[0]})</dd>
          {f.events.length > 0 && <><dt>Peak periods</dt><dd>{f.events.join(", ").replace(/the /g, "")}. Confirm about six weeks ahead.</dd></>}
        </dl>
        {f.notes.map((n) => <div key={n.city}><h2>Worth knowing about {n.city}</h2><p>{n.text}</p></div>)}
      </div>
      <h2>Your exact price</h2>
      <PlanFlight heading={false} member={Boolean(member)} initial={{ from: r.from, to: r.to, fromLabel: f.a[3], toLabel: f.b[3] }} guestNote={{ guest: t.guest, open: t.openOffice, demo: t.demo, promise: t.promise }} />
      <div className="article faq">
        <h2>Questions</h2>
        {faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name: `Private jet charter ${f.a[3]} to ${f.b[3]}`, serviceType: "Private jet charter", provider: { "@id": `${SITE.url}/#org` }, ...(f.price ? { offers: { "@type": "Offer", price: f.price, priceCurrency: f.q.trip.cur, description: "One way, 4 guests, all-inclusive Assured Price" } } : {}) }} />
    </>
  );
}
