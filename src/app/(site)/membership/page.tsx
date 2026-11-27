import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { JsonLd } from "@/components/JsonLd";
import { MembershipCard } from "@/components/office/Membership";
import { LEVELS, ASSURED_FEE } from "@/lib/membership";
import { SITE } from "@/lib/site";
import { currentMember } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Membership: Private and Assured",
  description: "Private membership is free: an estimate at once, then one final price within 2 hours. Assured membership makes the price on screen guaranteed, any day, booked in one tap.",
  alternates: { canonical: "/membership" },
};

export default async function Membership() {
  const m = await currentMember();
  return (
    <div className="article wide">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Service", name: "MyPrivate-Jet membership", provider: { "@id": `${SITE.url}/#org` },
        offers: [
          { "@type": "Offer", name: "Private membership", price: 0, priceCurrency: "EUR", description: LEVELS.private.line },
          { "@type": "Offer", name: "Assured membership", price: ASSURED_FEE.amount, priceCurrency: ASSURED_FEE.currency, description: LEVELS.assured.line },
        ],
      }} />
      <Crumbs items={[["/", "Home"], ["/membership", "Membership"]]} />
      <h1>Two ways to fly with us.</h1>
      <p className="lede">Both give you one recommended cabin, one all-inclusive price and one Dedicated Advisor. The difference is when the price becomes final.</p>
      <div className="levels">
        {(["private", "assured"] as const).map((k) => {
          const L = LEVELS[k];
          return (
            <section key={k} className={`lvl ${k}`}>
              <div className="lvl-n">{L.name}</div>
              <div className="lvl-p">{L.price}</div>
              <p className="lvl-l">{L.line}</p>
              <ul>{L.points.map((p) => <li key={p}>{p}</li>)}</ul>
              {k === "private" ? (
                <Link className="go ghost" href="/">{m ? "Plan a flight" : "Join free and plan a flight"}</Link>
              ) : m ? (
                m.tier === "assured" ? <p className="lvl-l"><b>You are an Assured member.</b></p> : <MembershipCard tier="private" requested={Boolean(m.assuredRequestedAt)} />
              ) : (
                <Link className="go" href="/office">Join, then become Assured</Link>
              )}
            </section>
          );
        })}
      </div>
      <h2>In one example</h2>
      <p>Four guests, Geneva to Nice on a Friday in June. A Private member sees the price at once, marked as an estimate, and receives the final price from their advisor within 2 hours, then accepts it with one tap. An Assured member sees the same figure marked as guaranteed and books it on the spot, even on Grand Prix weekend.</p>
      <p className="fine">The Assured fee and the fee-back promise are proposals pending final approval. Membership Terms are a draft for legal review.</p>
    </div>
  );
}
