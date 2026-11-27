import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/content/routes";
import { ARTICLES } from "@/content/articles";
import { AIRPORT_NOTES } from "@/lib/pricing/knowledge";
import { cityOf } from "@/lib/pricing/airports";
import { Crumbs } from "@/components/Crumbs";

export const metadata: Metadata = {
  title: "Private aviation guides",
  description: "Route guides with flight times and Assured Prices, airport notes and plain explanations of how private aviation works.",
  alternates: { canonical: "/guides" },
};

export default function Guides() {
  return (
    <div className="article" style={{ maxWidth: "none" }}>
      <Crumbs items={[["/", "Home"], ["/guides", "Guides"]]} />
      <h1>Worth knowing</h1>
      <p className="lede">Every request should teach you something. These guides collect what our advisors explain most often.</p>
      <h2>How it works</h2>
      <div className="cards">{ARTICLES.map((a) => <Link key={a.slug} href={`/guides/${a.slug}`}><em>{a.kicker}</em><b>{a.title}</b><span>{a.description}</span></Link>)}</div>
      <h2>Routes</h2>
      <div className="cards">{ROUTES.map((r) => <Link key={r.slug} href={`/routes/${r.slug}`}><em>Route guide</em><b>{r.fromName ?? cityOf(r.from)} to {r.toName ?? cityOf(r.to)}</b><span>{r.angle}</span></Link>)}</div>
      <h2>Airports</h2>
      <div className="cards">{Object.entries(AIRPORT_NOTES).map(([c, n]) => <Link key={c} href={`/guides/airport-${c.toLowerCase()}`}><em>{c}</em><b>{cityOf(c)}</b><span>{n.split(". ")[0]}.</span></Link>)}</div>
    </div>
  );
}
