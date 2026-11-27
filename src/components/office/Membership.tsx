"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LEVELS, type Level } from "@/lib/membership";
import { requestAssured } from "@/server/actions/member";
import { AssuredCard } from "../AssuredCard";

/** The member's level, and the one-tap path from Private to Assured. */
export function MembershipCard({ tier, requested, demo = false, holder }: { tier: Level; requested: boolean; demo?: boolean; holder?: string }) {
  const [asked, setAsked] = useState(requested);
  const [pending, start] = useTransition();
  const router = useRouter();
  const L = LEVELS[tier];
  return (
    <div className={`level ${tier}`}>
      <div className="lv-h"><span className="lv-badge">{L.name}</span>{tier === "assured" ? "Your prices are guaranteed." : "Estimates first, then one final price."}</div>
      {tier === "private" && (
        asked ? (
          <p className="lv-p">You asked to become Assured. Your advisor will confirm the details with you.</p>
        ) : (
          <>
            <p className="lv-p">{LEVELS.assured.line}</p>
            <div className="lv-a">
              <button className="mini" type="button" disabled={pending} onClick={() => start(async () => { if (!demo) { await requestAssured(); router.refresh(); } setAsked(true); })}>Become Assured</button>
              <Link href="/membership" className="so">How it works</Link>
            </div>
          </>
        )
      )}
      {tier === "assured" && <AssuredCard holder={holder} />}
      {tier === "assured" && <p className="lv-p">Fixed for 12 months, any day, with 72 hours&apos; notice in Europe. A 24/7 line to your advisor.</p>}
    </div>
  );
}
