import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentStaff } from "@/server/auth/session";
import { staffLogout } from "@/server/actions/advisor";
import { integrations } from "@/server/integrations/config";
import { OpsAssistant } from "@/components/advisor/OpsAssistant";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const s = await currentStaff();
  if (!s) redirect("/advisor/login");
  const missing = Object.entries(integrations).filter(([, v]) => !v).map(([k]) => ({ sms: "SMS", email: "email", payments: "card payments", ai: "AI" })[k]);
  return (
    <div className="wrap adv-shell">
      <header className="top">
        <div className="brand"><Link href="/advisor">MyPrivate<b>·</b>Jet</Link><small>Advisor desk · internal</small></div>
        <div className="hdr-r">
          <nav className="nav"><Link href="/advisor">Pipeline</Link><Link href="/advisor/inbox">Client messages</Link><Link href="/" target="_blank">Client app</Link></nav>
          <span className="st2">{s.name}</span>
          <form action={staffLogout}><button className="so" type="submit">Sign out</button></form>
        </div>
      </header>
      {missing.length > 0 && <p className="notice"><b>Test mode</b> · Not connected yet: {missing.join(", ")}. These steps are simulated and labelled.</p>}
      {children}
      <Suspense><OpsAssistant /></Suspense>
    </div>
  );
}
