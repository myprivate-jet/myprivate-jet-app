import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { CtaBand } from "@/components/CtaBand";
import { BOOKING_TERMS } from "@/lib/booking/terms";
import { MODEL_INFO } from "@/lib/pricing/engine";

export const metadata: Metadata = { title: "The Assured Price", description: "One recommended cabin and one all-inclusive price: an estimate for Private members, guaranteed for Assured members. Nothing payable until the aircraft is confirmed.", alternates: { canonical: "/assured-price" } };

export default function AssuredPrice() {
  return (
    <div className="article">
      <Crumbs items={[["/", "Home"], ["/assured-price", "The Assured Price"]]} />
      <h1>One recommendation. One final price.</h1>
      <p className="lede">You describe the trip in one sentence. We recommend one cabin standard and give one final, all-inclusive price at once, set from {MODEL_INFO.trainedOn.toLocaleString("en-GB")} real charter trips priced in 2025 and 2026 and adjusted to today&apos;s level.</p>
      <h2>Four promises</h2>
      <dl className="kv">
        <dt>One final price</dt><dd>Aircraft, crew, positioning, fees and catering included. It never moves once the aircraft is confirmed.</dd>
        <dt>Never a downgrade</dt><dd>If the operator cannot fly, a replacement of the same standard or higher, at our cost.</dd>
        <dt>Nothing to pay first</dt><dd>No deposit and no hours to buy. You pay once the aircraft is confirmed.</dd>
        <dt>Estimate or guarantee</dt><dd>Private members (free) see an estimate, then one final price within 2 hours. Assured members see a guaranteed price and book in one tap. <a href="/membership">The two memberships</a>.</dd>
        <dt>One advisor</dt><dd>Your Dedicated Advisor, from the first question to landing.</dd>
      </dl>
      <h2>The booking terms, in plain words</h2>
      <ol>{BOOKING_TERMS.map(([h, t]) => <li key={h}><b>{h}.</b> {t}</li>)}</ol>
      <p className="fine">Draft wording, pending legal review.</p>
      <CtaBand />
    </div>
  );
}
