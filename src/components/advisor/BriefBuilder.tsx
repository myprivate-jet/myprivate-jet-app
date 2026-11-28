"use client";
import { useRef, useState, useTransition } from "react";
import { BRIEF_SECTIONS } from "@/lib/booking/brief";
import { readBrief, saveBrief, sendBrief } from "@/server/actions/advisor";

/** Operator brief in, MyPrivate-Jet brief out. Internal fields never reach the client. */
export function BriefBuilder({ refId, title, initial, fromOperator, sent, aiReady }: { refId: string; title: string; initial: Record<string, string>; fromOperator: string[]; sent: boolean; aiReady: boolean }) {
  const [B, setB] = useState(initial);
  const [src, setSrc] = useState(new Set(fromOperator));
  const [status, setStatus] = useState(fromOperator.length ? `${fromOperator.length} fields read from the operator brief. Gold fields came from it; check them.` : "PDF, email or photo. The AI reads it and fills the fields below.");
  const [isSent, setSent] = useState(sent);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function set(k: string, v: string) {
    const next = { ...B, [k]: v };
    setB(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveBrief(refId, next), 600);
  }
  function load(file?: File) {
    const fd = new FormData();
    if (file) fd.set("file", file);
    setStatus("Reading the operator brief…");
    start(async () => {
      const r = await readBrief(refId, fd);
      if (!r.ok) return setStatus(r.error);
      setB(r.fields);
      setSrc(new Set(r.fromOperator));
      setStatus(`${r.fromOperator.length} fields read${r.simulated ? " from a sample brief (AI document reading not connected)" : " by AI"}. Gold fields came from the operator; check them.`);
    });
  }
  const r = (l: string, v?: string) => (v ? <div className="pr-r"><span>{l}</span><div>{v}</div></div> : null);
  return (
    <div className="bwrap">
      <div>
        <div className="upl">
          <label className="mini ghost" style={{ cursor: "pointer" }}>Load operator brief<input type="file" accept=".pdf,image/*" hidden onChange={(e) => load(e.target.files?.[0])} /></label>
          {!aiReady && <button className="so" type="button" onClick={() => load()}>Use a sample operator brief</button>}
          <span className="st2" aria-live="polite">{pending ? "Reading…" : status}</span>
        </div>
        {BRIEF_SECTIONS.map(([sec, fs]) => (
          <div key={sec}>
            <h4 className="bh">{sec}</h4>
            <div className="pgrid">
              {fs.map(([k, l, ty]) => (
                <label key={k} className={`fld ${src.has(k) ? "src" : ""}`}>{l}{ty === "int" ? " · internal" : ""}
                  {ty === "area" ? <textarea rows={3} value={B[k] ?? ""} onChange={(e) => set(k, e.target.value)} /> : <input value={B[k] ?? ""} onChange={(e) => set(k, e.target.value)} />}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <button className="btn" type="button" style={{ marginTop: 0 }} disabled={pending} onClick={() => start(async () => { await saveBrief(refId, B); await sendBrief(refId); setSent(true); })}>{isSent ? "Send again" : "Send to client"}</button>
          <span className="st2">{isSent ? "In the client's Office and by email." : "Goes to the client's Office and email. Internal fields are never shown."}</span>
        </div>
        <div className="bprev">
          <div className="pv-head"><div className="brand" style={{ fontSize: 20 }}>MyPrivate<b>·</b>Jet</div><div className="eyebrow">Flight brief · {refId}</div></div>
          <h3 className="pv-t">{title}</h3>
          <p className="sub" style={{ margin: "0 0 14px" }}>{B.date}{B.etd ? ` · departs ${B.etd}` : ""}{B.eta ? ` · arrives ${B.eta} local` : ""}</p>
          <div className="pv-s"><h5>Your aircraft</h5>{r("Aircraft", B.actype)}{r("Registration", B.reg)}{r("Flight time", B.ftime)}{r("Operated by", B.operator ? "An audited operator, on file" : "")}</div>
          <div className="pv-s"><h5>Departure</h5>{r("Airport", B.dep_ap)}{r("Terminal", B.dep_fbo)}{r("Address", B.dep_addr)}{r("Phone", B.dep_phone)}{r("Please arrive", B.dep_show)}{r("Access", B.dep_notes)}{r("Your car", B.car)}</div>
          <div className="pv-s"><h5>Arrival</h5>{r("Airport", B.arr_ap)}{r("Terminal", B.arr_fbo)}{r("Address", B.arr_addr)}{r("Phone", B.arr_phone)}{r("On arrival", B.arr_notes)}</div>
          <div className="pv-s"><h5>Your crew</h5>{r("Captain", B.capt)}{r("First officer", B.fo)}{r("Cabin attendant", B.ca)}</div>
          <div className="pv-s"><h5>On board</h5>{r("Guests", B.pax)}{r("Luggage", B.bags)}{r("Catering", B.cater)}{r("Weather", B.wx)}</div>
          {B.comment && <div className="pv-s"><h5>From your advisor</h5><p style={{ margin: 0, fontSize: 13.5 }}>{B.comment}</p></div>}
          <p className="fine" style={{ marginTop: 14 }}>Your Dedicated Advisor is one message away, at any time.</p>
        </div>
      </div>
    </div>
  );
}
