"use client";
import { useState, useTransition } from "react";
import { replyToClient } from "@/server/actions/advisor";

export function Reply({ memberId }: { memberId: string }) {
  const [t, setT] = useState("");
  const [pending, start] = useTransition();
  return (
    <form className="compose" onSubmit={(e) => { e.preventDefault(); start(async () => { await replyToClient(memberId, t); setT(""); }); }}>
      <textarea rows={4} value={t} onChange={(e) => setT(e.target.value)} placeholder="Reply as your client's Dedicated Advisor…" />
      <div><button className="mini" type="submit" disabled={pending || !t.trim()}>Send reply</button> <span className="st2">The client sees it in their chat at once.</span></div>
    </form>
  );
}
