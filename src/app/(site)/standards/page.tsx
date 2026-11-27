import type { Metadata } from "next";
import Link from "next/link";
import { ORDER, STANDARDS } from "@/lib/pricing/standards";
import { Crumbs } from "@/components/Crumbs";
import { CtaBand } from "@/components/CtaBand";

export const metadata: Metadata = {
  title: "Private jet cabin standards",
  description: "Five cabin standards, from short hops to intercontinental nonstop: seats, cabin height, lavatory, luggage and range, explained plainly.",
  alternates: { canonical: "/standards" },
};

export default function Standards() {
  return (
    <div className="article" style={{ maxWidth: "none" }}>
      <Crumbs items={[["/", "Home"], ["/standards", "Cabin standards"]]} />
      <h1>Five cabin standards. A promise about the cabin, not a particular aircraft.</h1>
      <p className="lede">We recommend the smallest standard that seats your party with room to spare, stays comfortable for the time in the air and carries your luggage. Then we find an audited aircraft that meets it.</p>
      <div className="cards">
        {ORDER.map((s) => { const d = STANDARDS[s]; return <Link key={s} href={`/standards/${d.slug}`}><em>Up to {d.maxPax} guests · {d.height}</em><b>{d.name}</b><span>{d.line} {d.examples}.</span></Link>; })}
      </div>
      <CtaBand />
    </div>
  );
}
