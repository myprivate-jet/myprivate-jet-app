"use client";
import { useRouter } from "next/navigation";
import { MembershipForm } from "../MembershipDialog";

/** Shown at /office for guests: membership in place, no redirect. */
export function JoinGate() {
  const router = useRouter();
  return (
    <div className="login" style={{ maxWidth: 460 }}>
      <MembershipForm onDone={() => router.refresh()} />
      <p className="fine">Already a member? Enter the same mobile number: we send you a new code. <a href="/demo">Or see a demo Office</a>.</p>
    </div>
  );
}
