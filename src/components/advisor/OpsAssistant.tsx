"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { askOps } from "@/server/actions/advisor";

const CHIPS = ["What needs me today?", "Brief me on this booking", "Notes for Sion", "Weather and NOTAMs", "Crew duty check"];

export function OpsAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ w: "c" | "p"; t: string }[]>([{ w: "p", t: "Good day. I'm your Flight Ops assistant. Ask me about any booking, airport, crew or permit. I draft; you decide." }]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useSearchParams().get("b") ?? undefined;
  async function ask(text: string) {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { w: "c", t: text }]);
    setQ("");
    setBusy(true);
    const r = await askOps(text, ref);
    setBusy(false);
    setMsgs((m) => [...m, { w: "p", t: r.answer + (r.ai ? "" : "") }]);
  }
  return (
    <>
      {!open && <button className="opsfab" style={{ display: "flex" }} type="button" onClick={() => setOpen(true)}><span className="mono" aria-hidden="true">AI</span>Flight Ops assistant</button>}
      {open && (
        <aside className="drawer" aria-label="Flight Ops assistant">
          <div className="dh"><span className="mono" aria-hidden="true">AI</span><div><b>Flight Ops assistant</b>Internal. Reads your bookings, mail and briefs.</div><button className="x" type="button" aria-label="Close" onClick={() => setOpen(false)}>&times;</button></div>
          <div className="thread">{msgs.map((m, i) => <div key={i} className={`bub ${m.w}`} style={{ whiteSpace: "pre-line" }}>{m.t}</div>)}{busy && <div className="bub p">…</div>}</div>
          <div className="chips">{CHIPS.map((c) => <button key={c} type="button" onClick={() => ask(c)}>{c}</button>)}</div>
          <form onSubmit={(e) => { e.preventDefault(); ask(q); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about your flights" aria-label="Ask the Flight Ops assistant" /><button className="btn" type="submit" style={{ marginTop: 0 }}>Ask</button></form>
        </aside>
      )}
    </>
  );
}
