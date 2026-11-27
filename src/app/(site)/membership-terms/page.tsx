import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { MANDATE_POINTS, MANDATE_TICK, TERMS_VERSION, BOOKING_TERMS } from "@/lib/booking/terms";

export const metadata: Metadata = { title: "Membership terms", alternates: { canonical: "/membership-terms" } };

export default function Terms() {
  return (
    <div className="article">
      <Crumbs items={[["/", "Home"], ["/membership-terms", "Membership terms"]]} />
      <h1>Membership terms</h1>
      <p className="notice"><b>Draft</b> · Version {TERMS_VERSION}. This wording is pending legal review and is not yet in force.</p>
      <h2>Membership</h2>
      <p>Membership is free. You give your name, email and mobile number, verified by SMS, and accept these terms with one tick: “{MANDATE_TICK}”</p>
      <h2>The mandate</h2>
      <ul>{MANDATE_POINTS.map((p) => <li key={p}>{p}</li>)}</ul>
      <h2>Booking terms</h2>
      <ol>{BOOKING_TERMS.map(([h, t]) => <li key={h}><b>{h}.</b> {t}</li>)}</ol>
    </div>
  );
}
