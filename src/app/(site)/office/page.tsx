import type { Metadata } from "next";
import Link from "next/link";
import { currentMember } from "@/server/auth/session";
import { memberBookings, memberProfile } from "@/server/queries";
import { cityOf } from "@/lib/pricing/airports";
import { STANDARDS, type StandardId } from "@/lib/pricing/standards";
import { toClientFlight } from "@/lib/booking/view";
import { profilePct } from "@/lib/booking/profile";
import { Flights } from "@/components/office/Flights";
import { Desk } from "@/components/office/Desk";
import { OfficeHead } from "@/components/office/OfficeHead";
import { MembershipCard } from "@/components/office/Membership";
import { JoinGate } from "@/components/office/JoinGate";
import { SignOut } from "@/components/office/SignOut";

export const metadata: Metadata = { title: "Your Private Office", robots: { index: false, follow: false } };

export default async function Office({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const m = await currentMember();
  if (!m) return <JoinGate />;
  const [rows, prof, sp] = await Promise.all([memberBookings(m.id), memberProfile(m.id), searchParams]);
  const flights = rows.filter((b) => b.stage < 11).map((b) => toClientFlight(b, cityOf(b.fromIcao), cityOf(b.toIcao), STANDARDS[(b.upgradedTo ?? b.standard) as StandardId]?.name ?? "Group aircraft"));
  const P = prof as Record<string, string | boolean>;
  const prefs: [string, string][] = [
    ["On board", [P.drinks, P.diet].filter(Boolean).join("; ") || "Tell us once, in your profile"],
    ["On arrival", P.cararr ? "Car at the aircraft" : "As you prefer"],
    ["Pets", P.pet ? String(P.pet) : "No"],
  ];
  const pct = profilePct(P);
  const name = P.title ? `${P.title} ${m.lastName}` : `${m.firstName} ${m.lastName}`;
  const stamp = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <>
      <OfficeHead name={name} stamp={stamp} />
      <div className="ogrid">
        <div className="card"><Flights flights={flights} highlight={sp.new} /></div>
        <div className="card">
          <h4>Your membership</h4>
          <MembershipCard tier={m.tier} requested={Boolean(m.assuredRequestedAt)} holder={`${m.firstName} ${m.lastName}`} />
          <h4 style={{ marginTop: 24 }}>Your standards</h4>
          <div className="prefs">{prefs.flatMap(([k, v]) => [<span key={k}>{k}</span>, <span key={k + "-v"}>{v}</span>])}</div>
          <p className="sub" style={{ margin: "14px 0 0", fontSize: 13 }}>Your advisor applies these to every request, so you never repeat them.</p>
          <div className="pm" style={{ marginTop: 18 }}><div className="meter"><span style={{ width: `${pct}%` }} /></div><span>Profile {pct}% complete · <Link className="so" href="/office/profile">Complete when you have time</Link></span></div>
          <h4 style={{ marginTop: 24 }}>Your advisor</h4>
          <p style={{ margin: 0, fontSize: 14 }}><b style={{ color: "var(--navy)" }}>Your Dedicated Advisor</b>, backed by the MyPrivate-Jet operations desk. Reachable by chat at every step.</p>
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--muted)" }}>Member since {m.createdAt.toISOString().slice(0, 10)} · Mobile ••• {m.phone.slice(-3)} verified · <SignOut /></p>
        </div>
      </div>
      <Desk />
    </>
  );
}
