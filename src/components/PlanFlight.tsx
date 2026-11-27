"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AirportInput, type AirportHit } from "./AirportInput";
import { MembershipDialog } from "./MembershipDialog";
import { openChat } from "./ChatWidget";
import { ORDER, STANDARDS, type StandardId } from "@/lib/pricing/standards";
import type { QuoteResult } from "@/lib/pricing/engine";
import { BOOKING_TERMS } from "@/lib/booking/terms";
import { boldSegments, longDate, money } from "@/lib/format";
import { bookFlight } from "@/server/actions/member";
import { track } from "@/lib/analytics";

type Bags = "std" | "ski" | "golf" | "large";
export interface PlanInitial { from: string; to: string; fromLabel: string; toLabel: string; pax?: number }

const hm = (h: number) => { const m = Math.round((h * 60) / 5) * 5; return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };

function defaultDates() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  const r = new Date(d);
  r.setDate(r.getDate() + 3);
  return [d.toISOString().slice(0, 10), r.toISOString().slice(0, 10)];
}

function Rich({ s }: { s: string }) {
  return <>{boldSegments(s).map((p, i) => (p.b ? <b key={i}>{p.t}</b> : <span key={i}>{p.t}</span>))}</>;
}

/** The brief is a sentence. Directly under it: one recommendation and one final price. */
export function PlanFlight({ member, initial, guestNote, heading = true }: { member: boolean; initial: PlanInitial; guestNote: { guest: string; open: string; demo: string; promise: string[][] }; heading?: boolean }) {
  const router = useRouter();
  const [d0, r0] = useMemo(defaultDates, []);
  const [from, setFrom] = useState<string | null>(initial.from);
  const [to, setTo] = useState<string | null>(initial.to);
  const [fromLabel, setFromLabel] = useState(initial.fromLabel);
  const [toLabel, setToLabel] = useState(initial.toLabel);
  const [date, setDate] = useState(d0);
  const [time, setTime] = useState("10:00");
  const [pax, setPax] = useState(initial.pax ?? 4);
  const [ret, setRet] = useState(false);
  const [rdate, setRdate] = useState(r0);
  const [bags, setBags] = useState<Bags>("std");
  const [standUp, setStandUp] = useState(false);
  const [attendant, setAttendant] = useState(false);
  const [pets, setPets] = useState(false);
  const [pick, setPick] = useState<StandardId | null>(null);
  const [q, setQ] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [review, setReview] = useState(false);
  const [gate, setGate] = useState<null | (() => void)>(null);
  const [booking, setBooking] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<HTMLElement>(null);

  const req = useMemo(() => ({ from: from ?? "", to: to ?? "", date, time, pax, ret, rdate: ret ? rdate : "", bags, standUp, attendant, pets, pick }), [from, to, date, time, pax, ret, rdate, bags, standUp, attendant, pets, pick]);

  useEffect(() => {
    if (!from || !to || from === to) { setQ(null); return; }
    const c = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/quote", { method: "POST", body: JSON.stringify(req), headers: { "Content-Type": "application/json" }, signal: c.signal });
        const j = await r.json();
        if (!r.ok) { setErr(j.error ?? "Please check the trip."); setQ(null); }
        else { setErr(""); setQ(j); track("quote_viewed", { standard: j.shown ?? "advisor", region: j.trip.route }); }
      } catch { /* aborted */ } finally { setLoading(false); }
    }, 180);
    return () => { clearTimeout(t); c.abort(); };
  }, [req, from, to]);

  // Remembered preferences: a per-browser convenience only.
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("mpj-prefs") || "{}");
      if (p.bags) setBags(p.bags); if (p.standUp) setStandUp(true); if (p.attendant) setAttendant(true); if (p.pets) setPets(true);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { try { localStorage.setItem("mpj-prefs", JSON.stringify({ bags, standUp, attendant, pets })); } catch { /* ignore */ } }, [bags, standUp, attendant, pets]);

  const gated = useCallback((fn: () => void) => { if (member) fn(); else setGate(() => fn); }, [member]);

  const tripLine = q ? `${q.trip.fromCity} to ${q.trip.toCity}, ${q.trip.date} at ${q.trip.time}, ${q.trip.pax} guests${q.shown ? `, ${STANDARDS[q.shown].name}` : ""}` : "No trip chosen yet";
  const chat = () => openChat({ context: tripLine });

  function confirm() {
    track("confirm_clicked", { standard: q?.shown ?? "advisor" });
    gated(() => { setReview(true); setTimeout(() => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); });
  }

  async function book() {
    setBooking(true);
    const r = await bookFlight(req);
    setBooking(false);
    if (!r.ok) { setErr(r.error); return; }
    track("booking_created", { standard: q?.shown ?? "advisor", currency: q?.trip.cur ?? "" });
    router.push(`/office?new=${r.ref}#fl-${r.ref}`);
  }

  const shown = q?.shown ?? null;
  const shownPrice = shown && q ? q.standards[shown].price : null;

  return (
    <>
      {heading && <h1 className="visually">Private jet charter with one recommended cabin and one Assured Price</h1>}
      <form className="brief" autoComplete="off" aria-label="Your trip" onSubmit={(e) => e.preventDefault()}>
        From <AirportInput id="from" label="From" value={from} display={fromLabel} onPick={(a: AirportHit | null) => { setFrom(a?.icao ?? null); if (a) setFromLabel(a.city || a.name); setPick(null); setReview(false); }} />{" "}
        to <AirportInput id="to" label="To" value={to} display={toLabel} onPick={(a) => { setTo(a?.icao ?? null); if (a) setToLabel(a.city || a.name); setPick(null); setReview(false); }} />,{" "}
        <input id="date" type="date" aria-label="Departure date" value={date} onChange={(e) => setDate(e.target.value)} /> at{" "}
        <input id="time" type="time" aria-label="Departure time" value={time} onChange={(e) => setTime(e.target.value)} />,{" "}
        <input id="pax" type="number" min={1} max={19} aria-label="Guests" value={pax} onChange={(e) => setPax(Math.max(1, Math.min(19, +e.target.value || 1)))} /> guests
        {ret && <>, returning <input id="rdate" type="date" aria-label="Return date" value={rdate} onChange={(e) => setRdate(e.target.value)} /></>}.
      </form>
      <div className="opts">
        <label><input type="checkbox" checked={ret} onChange={(e) => setRet(e.target.checked)} /> Return</label>
        <label>Luggage <select value={bags} onChange={(e) => setBags(e.target.value as Bags)}><option value="std">Suitcases</option><option value="ski">Skis</option><option value="golf">Golf bags</option><option value="large">Oversized items</option></select></label>
        <label><input type="checkbox" checked={standUp} onChange={(e) => setStandUp(e.target.checked)} /> Stand-up cabin</label>
        <label><input type="checkbox" checked={attendant} onChange={(e) => setAttendant(e.target.checked)} /> Cabin attendant</label>
        <label><input type="checkbox" checked={pets} onChange={(e) => setPets(e.target.checked)} /> Pets</label>
      </div>

      <section id="rec" ref={recRef} aria-live="polite" className={loading ? "loading" : ""}>
        {!q ? (
          <div className="rec"><div className="l"><div className="eyebrow">Your trip</div><p className="why">{err || "Choose both airports from the list. Your recommendation and final price appear here at once."}</p></div><div className="r" /></div>
        ) : shown && shownPrice ? (
          <div className="rec">
            <div className="l">
              <div className="eyebrow">{shown === q.recommended ? "We recommend" : "Your choice"}</div>
              <div className="std">{STANDARDS[shown].name}</div>
              <p className="why">{q.why}</p>
              <div>
                <div className="big">{money(shownPrice, q.trip.cur)}</div>
                <div className="final">{q.trip.ret ? "Return trip, " : "One way, "}final and all-inclusive{q.trip.route === "US" ? ", US federal taxes included" : ""}.</div>
              </div>
              <button className="btn" type="button" onClick={confirm}>Confirm this flight</button>
              <button className="talk" type="button" onClick={chat}>Or ask your advisor first</button>
              {shown !== q.recommended && <button className="btn ghost" type="button" onClick={() => { setPick(null); setReview(false); }}>Back to our recommendation</button>}
            </div>
            <div className="r"><Facts q={q} /></div>
          </div>
        ) : q.advisorStandard ? (
          <div className="rec">
            <div className="l">
              <div className="eyebrow">Your advisor will price this personally</div>
              <div className="std">{STANDARDS[q.advisorStandard].name}</div>
              <p className="why">{q.advisorReason}. You still send one request: your advisor replies with one final price within 2 hours.</p>
              <button className="btn" type="button" onClick={confirm}>Send this trip to your advisor</button>
              <button className="talk" type="button" onClick={chat}>Chat with your advisor about it</button>
            </div>
            <div className="r"><Facts q={q} /></div>
          </div>
        ) : (
          <div className="rec"><div className="l"><div className="eyebrow">No standard fits as described</div><p className="why">{q.trip.pax} guests on this route needs fewer must-haves or a larger party aircraft. We can arrange a group aircraft.</p><button className="btn" type="button" onClick={chat}>Ask your advisor</button></div><div className="r" /></div>
        )}
      </section>

      <div className="promise">{guestNote.promise.map(([b, t]) => <div key={b}><b>{b}</b>{t}</div>)}</div>
      {!member && (
        <p className="gnote">{guestNote.guest} <button type="button" onClick={() => gated(() => router.push("/office"))}>{guestNote.open}</button> <span aria-hidden="true">·</span> <button type="button" onClick={() => router.push("/demo")}>{guestNote.demo}</button></p>
      )}

      {review && q && (
        <div className="sheet" role="region" aria-label="Review and book" ref={reviewRef}>
          <div className="eyebrow">Review and book</div>
          <h3>{shown ? STANDARDS[shown].name : q.advisorStandard ? STANDARDS[q.advisorStandard].name : "A group aircraft"}{shownPrice ? `, ${money(shownPrice, q.trip.cur)}` : ""}</h3>
          <div className="rv">
            <div><span>Trip</span>{q.trip.fromCity} to {q.trip.toCity}, {longDate(q.trip.date)} at {q.trip.time}, {q.trip.pax} guests{q.trip.ret && q.trip.rdate ? `, returning ${longDate(q.trip.rdate)}` : ""}</div>
            <div><span>Price</span>{shownPrice ? `Final and all-inclusive: aircraft, crew, positioning, fees, catering${q.trip.route === "US" ? ", US taxes" : ""}.` : "Your advisor sets one final price within 2 hours. You approve it with one tap."}</div>
            <div><span>Payment</span>You pay MyPrivate-Jet once the aircraft is confirmed. We pay the operator.</div>
            <div><span>Assurance</span>{q.guarantee === "with-aircraft" ? `${q.event ? `Peak date (${q.event.replace(/^the /, "")})` : "Within a week of departure"}: this price is confirmed together with the aircraft. If it has to change, you accept or decline with one tap.` : "Confirmed or free. If this standard isn't available at this price, you get a higher standard at the same price, or one new price to accept or decline with a tap."}</div>
            <div><span>Cancellation</span>Free until the aircraft is confirmed.</div>
          </div>
          <details className="terms bt"><summary>Booking terms in full</summary><ol>{BOOKING_TERMS.map(([h, t]) => <li key={h}><b>{h}.</b> {t}</li>)}</ol><p className="fine">Draft for legal review.</p></details>
          <p className="mand">By booking, you instruct MyPrivate-Jet under your membership mandate to contract this flight and sign the charter agreement for you.</p>
          <div className="err" role="alert">{err}</div>
          <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn" type="button" onClick={book} disabled={booking}>{booking ? "Booking…" : shownPrice ? "Book this flight" : "Send to your advisor"}</button>
            <button className="talk" type="button" onClick={chat}>Ask your advisor first</button>
          </div>
        </div>
      )}

      <h2>The five standards</h2>
      <p className="sub">A promise about the cabin, not a particular aircraft. <a href="/standards">How each standard is defined</a>.</p>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th className="rowh" />
              {ORDER.map((x) => {
                const st = q?.standards[x].st;
                return (
                  <th key={x} className={x === (shown ?? q?.advisorStandard) ? "on" : ""}>
                    <button type="button" aria-disabled={st === "off"} onClick={() => { if (!q || st === "off") return; setPick(x); setReview(false); track("standard_selected", { standard: x }); recRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{STANDARDS[x].name}</button>
                    <span className="ex">{STANDARDS[x].examples}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <Row label="For this trip" q={q} on={shown} render={(x) => {
              const s = q?.standards[x];
              if (!s) return "–";
              if (s.st === "ok" && s.price) return <span className="tprice">{money(s.price, q!.trip.cur)}</span>;
              if (s.st === "adv") return <><span className="pill">Priced by your advisor</span><br /><span className="note">{s.note}</span></>;
              return <span className="note">{s.note}</span>;
            }} />
            <Row label="In the air" q={q} on={shown} render={(x) => (q ? (q.standards[x].st === "off" && q.standards[x].note?.includes("distance") ? "–" : hm(q.standards[x].hrs)) : "–")} />
            <Row label="Seats" q={q} on={shown} render={(x) => `Up to ${STANDARDS[x].maxPax}`} />
            <Row label="Cabin" q={q} on={shown} render={(x) => `${STANDARDS[x].height}${STANDARDS[x].standUp ? ", stand-up" : ", seated"}`} />
            <Row label="Cabin attendant" q={q} on={shown} render={(x) => (STANDARDS[x].attendant === true ? "Included" : STANDARDS[x].attendant ? "On request" : "No")} />
            <Row label="Best for" q={q} on={shown} render={(x) => STANDARDS[x].line} />
          </tbody>
        </table>
      </div>

      {gate && <MembershipDialog onClose={() => setGate(null)} onDone={() => { const fn = gate; setGate(null); router.refresh(); fn(); }} />}
    </>
  );
}

function Row({ label, q, on, render }: { label: string; q: QuoteResult | null; on: StandardId | null; render: (x: StandardId) => React.ReactNode }) {
  return (
    <tr>
      <th className="rowh">{label}</th>
      {ORDER.map((x) => <td key={x} className={`${x === on ? "on" : ""} ${q?.standards[x].st === "off" ? "na" : ""}`}>{render(x)}</td>)}
    </tr>
  );
}

function Facts({ q }: { q: QuoteResult }) {
  return (
    <>
      <div className="facts">{q.facts.map((f) => <div className="fact" key={f.k}><div className="k">{f.k}</div><div className="v">{f.v}</div><div className="d">{f.d}</div></div>)}</div>
      {q.insights.map((s, i) => <div className="insight" key={i}><Rich s={s} /></div>)}
    </>
  );
}
