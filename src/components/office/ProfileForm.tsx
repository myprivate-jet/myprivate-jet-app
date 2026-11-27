"use client";
import { useRef, useState } from "react";
import { PROFILE_SCHEMA, profilePct } from "@/lib/booking/profile";
import { saveProfile } from "@/server/actions/member";

/** Everything saves as you type. Nothing here is required to book. */
export function ProfileForm({ initial, demo = false }: { initial: Record<string, string | boolean>; demo?: boolean }) {
  const [P, setP] = useState(initial);
  const [saved, setSaved] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pct = profilePct(P);
  function set(k: string, v: string | boolean) {
    const next = { ...P, [k]: v };
    setP(next);
    if (demo) return;
    setSaved("Saving…");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => { const r = await saveProfile({ [k]: v }); setSaved(r.ok ? "Saved." : "Could not save. Please try again."); }, 500);
  }
  return (
    <>
      <div className="om">
        <div><div className="eyebrow">Your profile</div><h1 className="oh">Complete it when you have time</h1><p className="sub" style={{ margin: 0 }}>Everything saves as you type, and your advisor applies it to every flight. Nothing here is required to book.</p></div>
        <div className="pm"><div className="meter"><span style={{ width: `${pct}%` }} /></div><span>{pct}% complete</span></div>
      </div>
      {PROFILE_SCHEMA.map(([sec, fs]) => (
        <section className="psec" key={sec}>
          <h3>{sec}</h3>
          <div className="pgrid">
            {fs.map(([k, l, ty = "text"]) => {
              const v = P[k] ?? "";
              if (ty === "chk") return <label className="pchk" key={k}><input type="checkbox" checked={Boolean(v)} onChange={(e) => set(k, e.target.checked)} /> {l}</label>;
              if (ty === "ro") return <label className="fld" key={k}>{l}<input value={String(v)} disabled /></label>;
              if (ty === "area") return <label className="fld" key={k}>{l}<textarea rows={2} value={String(v)} onChange={(e) => set(k, e.target.value)} /></label>;
              if (ty.startsWith("sel:")) return <label className="fld" key={k}>{l}<select value={String(v)} onChange={(e) => set(k, e.target.value)}>{ty.slice(4).split("|").map((o) => <option key={o} value={o}>{o || "—"}</option>)}</select></label>;
              return <label className="fld" key={k}>{l}<input type={ty} value={String(v)} placeholder={/^t\d$/.test(k) ? "Name, relationship" : undefined} onChange={(e) => set(k, e.target.value)} /></label>;
            })}
          </div>
        </section>
      ))}
      <p className="fine" style={{ marginTop: 28 }} aria-live="polite">{demo ? "Demo profile: changes are not saved." : saved}</p>
    </>
  );
}
