"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AirportInput, type AirportHit } from "./AirportInput";
import { AssuredCard } from "./AssuredCard";
import { DateCalendar } from "./DateCalendar";
import { LEVELS } from "@/lib/membership";
import { MembershipDialog } from "./MembershipDialog";
import { openChat } from "./ChatWidget";
import { ORDER, STANDARDS, type StandardId } from "@/lib/pricing/standards";
import type { QuoteResult } from "@/lib/pricing/engine";
import { BOOKING_TERMS } from "@/lib/booking/terms";
import { boldSegments, money } from "@/lib/format";
import { bookFlight } from "@/server/actions/member";
import { track } from "@/lib/analytics";

type Bags = "std" | "ski" | "golf" | "large";
type Step = "to" | "from" | "when" | "who" | "answer";
export interface PlanInitial { from: string; to: string; fromLabel: string; toLabel: string; pax?: number }

/** Places people actually ask for. One tap answers the question. */
const PLACES: [string, string][] = [
  ["LFMN", "Nice"], ["LSGG", "Geneva"], ["LFPB", "Paris"], ["EGLF", "London"], ["LEIB", "Ibiza"],
  ["LGMK", "Mykonos"], ["LIML", "Milan"], ["LSZH", "Zurich"], ["OMDB", "Dubai"], ["KTEB", "New York"],
];
const TIMES: [string, string][] = [["08:00", "Early"], ["10:00", "Morning"], ["13:00", "Midday"], ["16:00", "Afternoon"], ["19:00", "Evening"]];
const BAGS: [Bags, string][] = [["std", "Suitcases"], ["ski", "Skis"], ["golf", "Golf bags"], ["large", "Oversized"]];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const plus = (n: number, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return d; };
const nextDow = (dow: number, min = 1) => { let d = plus(min); while (d.getDay() !== dow) d = plus(1, d); return d; };
const dayLabel = (s: string) => new Date(s + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const hm = (h: number) => { const m = Math.round((h * 60) / 5) * 5; return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };

function Rich({ s }: { s: string }) {
  return <>{boldSegments(s).map((p, i) => (p.b ? <b key={i}>{p.t}</b> : <span key={i}>{p.t}</span>))}</>;
}

const QUESTIONS: Record<Exclude<Step, "answer">, string> = { to: "Where to?", from: "Flying from?", when: "When?", who: "How many of you?" };
const QORDER: Exclude<Step, "answer">[] = ["to", "from", "when", "who"];
const HINTS: Record<Exclude<Step, "answer">, string> = {
  to: "Tap a place or type any city. Four taps to your price; no account needed to see it.",
  from: "Then when, and how many of you. Your price follows at once.",
  when: "Choose a day and a time of day. Then how many of you, and your price.",
  who: "Tap the number. Your recommended cabin and price appear straight away.",
};

/**
 * One question per screen, then one answer: a single recommended cabin and a single final price.
 * Every answer stays visible as a chip at the top, and a tap on it goes back to that question.
 */
export function PlanFlight({ member, initial, guestNote, heading = true }: { member: boolean; initial?: PlanInitial; guestNote: { guest: string; open: string; demo: string; promise: string[][] }; heading?: boolean }) {
  const router = useRouter();
  const defaultDate = useMemo(() => iso(nextDow(5, 14)), []);
  const [step, setStep] = useState<Step>(initial ? "answer" : "to");
  const [from, setFrom] = useState<string | null>(initial?.from ?? null);
  const [to, setTo] = useState<string | null>(initial?.to ?? null);
  const [fromLabel, setFromLabel] = useState(initial?.fromLabel ?? "");
  const [toLabel, setToLabel] = useState(initial?.toLabel ?? "");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("10:00");
  const [cal, setCal] = useState(false);
  const [pax, setPax] = useState(initial?.pax ?? 4);
  const [ret, setRet] = useState(false);
  const [rdate, setRdate] = useState(() => iso(plus(3, new Date(defaultDate + "T12:00"))));
  const [bags, setBags] = useState<Bags>("std");
  const [standUp, setStandUp] = useState(false);
  const [attendant, setAttendant] = useState(false);
  const [pets, setPets] = useState(false);
  const [pick, setPick] = useState<StandardId | null>(null);
  const [q, setQ] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [more, setMore] = useState(false);
  const [adjust, setAdjust] = useState(false);
  const extras = [ret, bags !== "std", standUp, attendant, pets, Boolean(pick)].filter(Boolean).length;
  const [gate, setGate] = useState<null | (() => void)>(null);
  const [booking, setBooking] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const req = useMemo(() => ({ from: from ?? "", to: to ?? "", date, time, pax, ret, rdate: ret ? rdate : "", bags, standUp, attendant, pets, pick }), [from, to, date, time, pax, ret, rdate, bags, standUp, attendant, pets, pick]);
  const ready = Boolean(from && to && from !== to);

  // The price is fetched as soon as the route is known, so the answer is already there when the last question is answered.
  useEffect(() => {
    if (!ready) { setQ(null); return; }
    const c = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/quote", { method: "POST", body: JSON.stringify(req), headers: { "Content-Type": "application/json" }, signal: c.signal });
        const j = await r.json();
        if (!r.ok) { setErr(j.error ?? "Please check the trip."); setQ(null); }
        else { setErr(""); setQ(j); }
      } catch { /* aborted */ } finally { setLoading(false); }
    }, 150);
    return () => { clearTimeout(t); c.abort(); };
  }, [req, ready]);

  useEffect(() => { if (step === "answer" && q) track("quote_viewed", { standard: q.shown ?? "advisor", region: q.trip.route }); }, [step, q]);

  // Remembered preferences: a per-browser convenience only.
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("mpj-prefs") || "{}");
      if (p.bags) setBags(p.bags); if (p.standUp) setStandUp(true); if (p.attendant) setAttendant(true); if (p.pets) setPets(true);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { try { localStorage.setItem("mpj-prefs", JSON.stringify({ bags, standUp, attendant, pets })); } catch { /* ignore */ } }, [bags, standUp, attendant, pets]);

  const [fromKnown, setFromKnown] = useState(Boolean(initial));
  const [done, setDone] = useState(Boolean(initial));
  const go = (s: Step) => { setStep(s); if (s === "answer") setDone(true); topRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
  /** After an answer: the next unanswered question, or straight back to the price once everything is known. */
  const next = (after: Step) => {
    if (done) return go("answer");
    const order: Step[] = ["to", "from", "when", "who", "answer"];
    const n = order[order.indexOf(after) + 1];
    go(n === "from" && fromKnown ? "when" : n);
  };

  const gated = useCallback((fn: () => void) => { if (member) fn(); else setGate(() => fn); }, [member]);
  const tripLine = q ? `${q.trip.fromCity} to ${q.trip.toCity}, ${q.trip.date} at ${q.trip.time}, ${q.trip.pax} guests${q.shown ? `, ${STANDARDS[q.shown].name}` : ""}` : "No trip chosen yet";
  const chat = () => openChat({ context: tripLine });

  /** One tap books at the price on screen, for every member. Only a standard priced by hand goes to the advisor first. */
  function confirm() {
    track("confirm_clicked", { standard: q?.shown ?? "advisor", tier: q?.tier ?? "guest" });
    gated(() => { void book(); });
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
  const chips: [Step, string][] = [];
  const fromShown = Boolean(from && (fromKnown || step !== "from"));
  if (fromShown) chips.push(["from", fromLabel]);
  if (to) chips.push(["to", fromShown ? `→ ${toLabel}` : `to ${toLabel}`]);
  if (step === "who" || step === "answer") chips.push(["when", `${dayLabel(date)}, ${time}`]);
  if (step === "answer") chips.push(["who", `${pax} ${pax === 1 ? "guest" : "guests"}`]);

  return (
    <div className={`ask ${heading ? "" : "embedded"}`} ref={topRef}>
      {heading && <h1 className="visually">Private jet charter with one recommended cabin and one Assured Price</h1>}

      {chips.length > 0 && (
        <nav className="trail" aria-label="Your answers">
          {chips.map(([s, l]) => <button key={s} type="button" className={step === s ? "on" : ""} onClick={() => go(s)}>{l}</button>)}
        </nav>
      )}

      {step === "to" && heading && !to && (
        <section className="hero-sky" aria-label="MyPrivate-Jet">
          <p className="hs-k">Private aviation, quietly done</p>
          <p className="hs-t">We think of everything.<br /><em>You simply fly.</em></p>
        </section>
      )}

      {step !== "answer" && (
        <section className="q" aria-live="polite" key={step}>
          <div className="prog" aria-label={`Question ${QORDER.indexOf(step) + 1} of 4`}>
            {QORDER.map((k, i) => <span key={k} className={i <= QORDER.indexOf(step) ? "on" : ""} />)}
          </div>
          <h2 className="qh">{QUESTIONS[step]}</h2>
          <p className="hint">{HINTS[step]}</p>

          {(step === "to" || step === "from") && (
            <>
              <AirportInput
                key={step}
                id={step}
                label={step === "to" ? "Destination" : "Departure"}
                className="big-in"
                placeholder="City or airport"
                autoFocus={!initial}
                value={step === "to" ? to : from}
                display={step === "to" ? toLabel : fromLabel}
                onPick={(a: AirportHit | null) => {
                  if (!a) return;
                  const label = a.city || a.name;
                  if (step === "to") { setTo(a.icao); setToLabel(label); } else { setFrom(a.icao); setFromLabel(label); setFromKnown(true); }
                  setPick(null);
                  next(step);
                }}
              />
              <div className="choices">
                {PLACES.filter(([c]) => c !== (step === "to" ? from : to)).slice(0, 8).map(([c, l]) => (
                  <button key={c} type="button" onClick={() => {
                    if (step === "to") { setTo(c); setToLabel(l); } else { setFrom(c); setFromLabel(l); setFromKnown(true); }
                    setPick(null);
                    next(step);
                  }}>{l}</button>
                ))}
              </div>
            </>
          )}

          {step === "when" && (
            <>
              {(() => {
                const quick = [[iso(plus(1)), "Tomorrow"], [iso(nextDow(5)), "Friday"], [iso(plus(7)), "In a week"], [iso(plus(30)), "In a month"]];
                const custom = !quick.some(([d]) => d === date);
                return (
                  <>
                    <div className="choices when">
                      {quick.map(([d, l]) => (
                        <button key={l} type="button" className={date === d ? "on" : ""} onClick={() => { setDate(d); setCal(false); }}>{l}<small>{dayLabel(d)}</small></button>
                      ))}
                      <button type="button" className={`other ${custom ? "on" : ""}`} aria-expanded={cal} onClick={() => setCal(!cal)}>{custom ? dayLabel(date) : "Another date"}<small>{cal ? "Close" : custom ? "Change" : "Any day, up to a year ahead"}</small></button>
                    </div>
                    {cal && <DateCalendar value={date} min={iso(new Date())} onPick={(d) => { setDate(d); setCal(false); }} />}
                  </>
                );
              })()}
              <div className="seg" role="radiogroup" aria-label="Time of departure">
                {TIMES.map(([t, l]) => <button key={t} type="button" role="radio" aria-checked={time === t} className={time === t ? "on" : ""} onClick={() => setTime(t)}>{l}<small>{t}</small></button>)}
              </div>
              <button className="go" type="button" onClick={() => next("when")}>Continue</button>
            </>
          )}

          {step === "who" && (
            <div className="pad" role="group" aria-label="Number of guests">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={pax === n ? "on" : ""} onClick={() => { setPax(n); next("who"); }}>{n}</button>
              ))}
              <label className="more-pax"><span>More</span><input type="number" min={9} max={19} placeholder="9+" aria-label="More than eight guests" onKeyDown={(e) => { if (e.key === "Enter") { const v = Math.max(1, Math.min(19, +(e.target as HTMLInputElement).value || 9)); setPax(v); next("who"); } }} onBlur={(e) => { if (e.target.value) { setPax(Math.max(1, Math.min(19, +e.target.value))); next("who"); } }} /></label>
            </div>
          )}

          {step === "to" && (
            <div className="manifesto">
              <p>Tell us where. We take care of everything else.</p>
              <p className="m2">Not a marketplace, not an auction, never the cheapest bidder. One advisor, audited operators, and a price you can hold us to.</p>
              <a className="so" href="/demo">See what members see</a>
            </div>
          )}
        </section>
      )}

      {step === "answer" && (
        <section className={`answer ${loading ? "loading" : ""}`} aria-live="polite">
          {!q ? (
            <div className="card-a"><p className="why">{err || (ready ? "Pricing your flight…" : "Choose both airports to see your price.")}</p></div>
          ) : shown && shownPrice ? (
            <div className={`card-a ${q.guarantee === "instant" ? "is-assured" : ""}`}>
              <div className="eyebrow">{q.guarantee === "instant" ? "Your Assured Price" : shown === q.recommended ? "Your price" : "Your choice"}</div>
              <div className="std">{STANDARDS[shown].name}</div>
              <div className="big">{money(shownPrice, q.trip.cur)}</div>
              <div className="final">
                {q.trip.ret ? "Return" : "One way"} · all-inclusive{q.trip.route === "US" ? " · US taxes included" : ""}
                {q.guarantee === "instant" ? " · price and aircraft guaranteed" : " · firm price, no waiting"}
              </div>
              <p className="why">{q.why}</p>
              <button className="go" type="button" onClick={confirm} disabled={booking}>{booking ? "One moment…" : "Book now"}</button>
              <NextSteps items={q.guarantee === "instant"
                ? ["Tap once. That is your booking, at this price.", "Your aircraft is guaranteed: we confirm it and the crew within 2 hours.", "You pay once it is confirmed. Your advisor handles everything else."]
                : [member ? "Tap once. That is your booking, at this price." : "Tap once. First time only: your name and mobile, 30 seconds.", "Within 2 hours we confirm your aircraft and crew, from every suitable aircraft in this cabin.", "Nothing to pay until it is confirmed. If none can be, we upgrade you at no extra cost or release you, free."]} />
              <button className="talk" type="button" onClick={chat}>Ask your advisor first</button>
              <p className="cmp">{q.tier === "assured"
                ? <><b>Assured:</b> a newer aircraft{q.guarantee === "instant" ? ", guaranteed" : ", guaranteed with " + q.notice + " hours' notice"}, at a price fixed for 12 months, peak days included.</>
                : <><b>Private:</b> today&apos;s price, any suitable aircraft, subject to availability. Assured guarantees a newer aircraft at a price fixed all year.</>}</p>
            </div>
          ) : q.advisorStandard ? (
            <div className="card-a">
              <div className="eyebrow">Priced personally</div>
              <div className="std">{STANDARDS[q.advisorStandard].name}</div>
              <p className="why">{q.advisorReason}.</p>
              <button className="go" type="button" onClick={confirm} disabled={booking}>{booking ? "One moment…" : "Send to your advisor"}</button>
              <NextSteps items={[member ? "Tap once. Free, and you are not committed." : "Tap once. First time: your name and mobile, 30 seconds, free.", "Within 2 hours your advisor sends you one final, all-inclusive price.", "Accept it with one tap. Nothing to pay until the aircraft is confirmed."]} />
              <button className="talk" type="button" onClick={chat}>Ask your advisor first</button>
            </div>
          ) : (
            <div className="card-a">
              <div className="eyebrow">No standard fits as described</div>
              <p className="why">{q.trip.pax} guests on this route needs fewer must-haves or a larger party aircraft. We can arrange a group aircraft.</p>
              <button className="go" type="button" onClick={chat}>Ask your advisor</button>
            </div>
          )}

          {q && (
            <>
              <div className="disc">
                <button className="more" type="button" aria-expanded={adjust} onClick={() => setAdjust(!adjust)}>{adjust ? "Done" : `Change cabin or add extras${extras ? ` (${extras})` : ""}`}</button>
                <button className="more" type="button" aria-expanded={more} onClick={() => setMore(!more)}>{more ? "Hide details" : "Why this cabin"}</button>
              </div>
              {adjust && <div className="adjust">
              <div className="tweaks" aria-label="Anything special">
                <button type="button" aria-pressed={ret} className={ret ? "on" : ""} onClick={() => { setRet(!ret); }}>Return</button>
                {ret && <label className="tw-date"><span className="visually">Return date</span><input type="date" value={rdate} min={date} onChange={(e) => e.target.value && setRdate(e.target.value)} /></label>}
                <label className={`tw-sel ${bags !== "std" ? "on" : ""}`}><span className="visually">Luggage</span><select value={bags} onChange={(e) => setBags(e.target.value as Bags)}>{BAGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
                <button type="button" aria-pressed={standUp} className={standUp ? "on" : ""} onClick={() => setStandUp(!standUp)}>Stand-up cabin</button>
                <button type="button" aria-pressed={attendant} className={attendant ? "on" : ""} onClick={() => setAttendant(!attendant)}>Cabin attendant</button>
                <button type="button" aria-pressed={pets} className={pets ? "on" : ""} onClick={() => setPets(!pets)}>Pets</button>
              </div>

              <div className="others" role="group" aria-label="The five cabin standards">
                {ORDER.map((x) => {
                  const s = q.standards[x];
                  const on = x === (shown ?? q.advisorStandard);
                  return (
                    <button key={x} type="button" className={`${on ? "on" : ""} ${s.st === "off" ? "off" : ""}`} aria-pressed={on} disabled={s.st === "off"} title={s.note ?? undefined}
                      onClick={() => { setPick(x === q.recommended ? null : x); track("standard_selected", { standard: x }); }}>
                      <span className="n">{STANDARDS[x].name.replace(/^The /, "")}</span>
                      <span className="p">{s.st === "ok" && s.price ? money(s.price, q.trip.cur) : s.st === "adv" ? "On request" : "Not suited"}</span>
                    </button>
                  );
                })}
              </div>
              </div>}

              {more && (
                <div className="detail">
                  <div className="facts">{q.facts.map((f) => <div className="fact" key={f.k}><div className="k">{f.k}</div><div className="v">{f.v}</div><div className="d">{f.d}</div></div>)}</div>
                  {q.insights.map((s, i) => <div className="insight" key={i}><Rich s={s} /></div>)}
                  {shown && <p className="sub">{STANDARDS[shown].line} {hm(q.standards[shown].hrs)} in the air. <a href={`/standards/${STANDARDS[shown].slug}`}>About this standard</a></p>}
                </div>
              )}
            </>
          )}

          {q && q.guarantee !== "instant" && q.tier !== "assured" && shownPrice && (
            <a className="upsell" href="/membership">
              <AssuredCard size="sm" />
              <span className="up-t"><b>Become Assured</b><span>A newer aircraft, guaranteed. Your prices fixed for 12 months, peak days included. {LEVELS.assured.price}.</span></span>
            </a>
          )}
          {q && <details className="terms bt mini-terms"><summary>Booking terms</summary><ol>{BOOKING_TERMS.map(([h, t]) => <li key={h}><b>{h}.</b> {t}</li>)}</ol><p className="fine">Draft for legal review.</p></details>}
          {err && q && <div className="err" role="alert">{err}</div>}

          <div className="promise-line">{guestNote.promise.map(([b]) => <span key={b}>{b}</span>)}</div>
        </section>
      )}

      {gate && <MembershipDialog onClose={() => setGate(null)} onDone={() => { const fn = gate; setGate(null); router.refresh(); fn(); }} />}
    </div>
  );
}

/** What happens next, in three short lines, under every main button. */
function NextSteps({ items }: { items: string[] }) {
  return (
    <ol className="next" aria-label="What happens next">
      {items.map((t, i) => <li key={i}><span>{i + 1}</span>{t}</li>)}
    </ol>
  );
}
