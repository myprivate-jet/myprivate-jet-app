import type { Metadata } from "next";
import Link from "next/link";
import { Flights } from "@/components/office/Flights";
import { Desk } from "@/components/office/Desk";
import { OfficeHead } from "@/components/office/OfficeHead";
import { MembershipCard } from "@/components/office/Membership";
import { demoFlights, demoPast, DEMO_PREFS } from "@/lib/demo";

export const metadata: Metadata = {
  title: "See the Private Office",
  description: "What MyPrivate-Jet members see: every flight with a checklist of each step, one advisor, and the Private Aviation Desk.",
  alternates: { canonical: "/demo" },
};

export default function Demo() {
  const stamp = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <>
      <div className="demo-bar"><span><b>Demo Office</b> · A sample client, Mrs Claire Laurent, to show what members see. Names, notes and flights are illustrative; prices come from the live price model.</span><Link className="so" href="/">Leave the demo</Link></div>
      <OfficeHead name="Mrs Laurent" stamp={stamp} />
      <div className="ogrid">
        <div className="card"><Flights flights={demoFlights()} demo past={demoPast()} /></div>
        <div className="card">
          <h4>Your membership</h4>
          <MembershipCard tier={"assured"} requested={false} demo holder="Claire Laurent" />
          <h4 style={{ marginTop: 24 }}>Your standards</h4>
          <div className="prefs">{DEMO_PREFS.flatMap(([k, v]) => [<span key={k}>{k}</span>, <span key={k + "-v"}>{v}</span>])}</div>
          <p className="sub" style={{ margin: "14px 0 0", fontSize: 13 }}>Your advisor applies these to every request, so you never repeat them.</p>
          <h4 style={{ marginTop: 24 }}>Your advisor</h4>
          <p style={{ margin: 0, fontSize: 14 }}><b style={{ color: "var(--navy)" }}>Your Dedicated Advisor</b>, backed by the MyPrivate-Jet operations desk. Reachable by chat at every step.</p>
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--muted)" }}>Member since 2025-03-14 · Mobile +41 ••• 208 verified</p>
        </div>
      </div>
      <Desk />
    </>
  );
}
