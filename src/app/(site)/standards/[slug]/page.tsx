import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ORDER, STANDARDS } from "@/lib/pricing/standards";
import { Crumbs } from "@/components/Crumbs";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

const find = (slug: string) => ORDER.map((s) => STANDARDS[s]).find((d) => d.slug === slug);
export const generateStaticParams = () => ORDER.map((s) => ({ slug: STANDARDS[s].slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const d = find((await params).slug);
  if (!d) return {};
  return { title: `${d.name}: private jet cabin standard`, description: `${d.line} Up to ${d.maxPax} guests, cabin height ${d.height}, ${d.lavatory.toLowerCase()} lavatory. Typical aircraft: ${d.examples}.`, alternates: { canonical: `/standards/${d.slug}` } };
}

export default async function StandardPage({ params }: { params: Promise<{ slug: string }> }) {
  const d = find((await params).slug);
  if (!d) notFound();
  const range = Math.round(d.screenKm / 100) * 100;
  const comfort = d.comfortH >= 10 ? "intercontinental days" : `about ${d.comfortH} hours`;
  return (
    <div className="article">
      <Crumbs items={[["/", "Home"], ["/standards", "Cabin standards"], [`/standards/${d.slug}`, d.name]]} />
      <h1>{d.name}</h1>
      <p className="lede">{d.line} Comfortable for {comfort} in the air, with up to {d.maxPax} guests.</p>
      <dl className="kv">
        <dt>Guests</dt><dd>Up to {d.maxPax}; we recommend it for up to {d.maxPax - 1}, so there is a spare seat</dd>
        <dt>Cabin height</dt><dd>{d.height}, {d.standUp ? "stand-up cabin" : "seated cabin"}</dd>
        <dt>Lavatory</dt><dd>{d.lavatory}</dd>
        <dt>Cabin attendant</dt><dd>{d.attendant === true ? "Included" : d.attendant ? "On request" : "Not as standard"}</dd>
        <dt>Luggage hold</dt><dd>{d.hold}{d.skis ? "; skis and golf bags fit" : "; skis and golf bags are a challenge"}</dd>
        <dt>Wi-Fi</dt><dd>{d.wifi}</dd>
        <dt>Nonstop range</dt><dd>About {range.toLocaleString("en-GB")} km in our planning</dd>
        <dt>Typical aircraft</dt><dd>{d.examples}</dd>
      </dl>
      <p className="fine">Cabin facts are typical of the standard and confirmed per aircraft before you fly.</p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name: `${d.name} private jet charter`, serviceType: "Private jet charter", provider: { "@id": `${SITE.url}/#org` }, description: d.line }} />
      <CtaBand text={`See ${d.name} priced for your trip.`} />
    </div>
  );
}
