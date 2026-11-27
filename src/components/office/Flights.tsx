"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CLIENT_STEPS, type ClientStepKey, type StepState } from "@/lib/booking/stages";
import type { ClientFlight } from "@/lib/booking/view";
import { addDays, longDate, money, shortDate } from "@/lib/format";
import { payBooking, savePassengers } from "@/server/actions/member";
import { Modal } from "../MembershipDialog";

const priceText = (x: ClientFlight) => (x.price != null ? money(x.price, x.currency) : "Being priced");

function stepSub(x: ClientFlight, k: ClientStepKey, st: StepState) {
  const P = priceText(x);
  switch (k) {
    case "book": return x.price === null ? "Your advisor sets one final price within 2 hours." : "Your price is final.";
    case "ac": return st === "done" ? `${x.aircraft ?? "Aircraft"}. Registration, operator and crew on file.` : st === "now" ? "We confirm within 2 hours. If this standard isn't available at your price, you choose with one tap. Nothing is payable before." : "Within 2 hours of booking.";
    case "agr": return st === "done" ? "Signed on your behalf under your membership mandate. Nothing for you to sign." : "Signed for you once the aircraft is confirmed. Nothing for you to sign.";
    case "pay": return st === "done" ? "Received. Thank you." : st === "now" ? `${P}${x.payBy ? `, by ${shortDate(x.payBy)}` : ""}. Bank transfer or card. You pay us only; we pay the operator.` : "Requested once your aircraft is confirmed.";
    case "pax": { const nn = x.names.filter(Boolean).length, pp = x.passports.filter(Boolean).length; return st === "done" ? `All ${x.pax} guests named, passports added.` : `${nn} of ${x.pax} named, ${pp} of ${x.pax} passports. Add the rest whenever convenient, up to 24 hours before.`; }
    case "brief": return st === "done" ? "Sent: terminal, car, catering and weather." : `${shortDate(addDays(x.date, -2))}: terminal, car, catering and weather.`;
    case "fly": return st === "done" ? "Flown. Invoice and receipt in your documents." : `${shortDate(x.date)} at ${x.time}. We follow the flight.`;
  }
}

function docs(x: ClientFlight) {
  const d = ["Booking confirmation"];
  if (x.steps.agr === "done") d.push("Charter agreement");
  if (x.steps.pay !== "todo") d.push("Invoice");
  if (x.steps.pay === "done") d.push("Receipt");
  if (x.brief) d.push("Flight brief");
  return d;
}

export function Flights({ flights, demo = false, highlight, past }: { flights: ClientFlight[]; demo?: boolean; highlight?: string; past?: { route: string; standard: string; price: string; date: string; pax: number; line: string }[] }) {
  const [sheet, setSheet] = useState<null | { kind: "pay" | "pax" | "brief"; f: ClientFlight }>(null);
  return (
    <>
      <h4>Upcoming flights</h4>
      {!flights.length && <p className="sub" style={{ margin: 0 }}>No flights yet. When you book one, it appears here with a checklist of every step.</p>}
      {flights.map((x) => (
        <div className={`fl ${highlight === x.ref ? "new" : ""}`} id={`fl-${x.ref}`} key={x.ref}>
          <div className="hd"><b>{x.fromCity} to {x.toCity}</b><span className="pr">{priceText(x)}</span></div>
          <div className="d">{longDate(x.date)} at {x.time} · {x.pax} guests · {x.standardName}{x.ret ? " · return" : ""} · {x.ref}</div>
          <ol className="cl">
            {CLIENT_STEPS.map(({ key, name }) => {
              const st = x.steps[key];
              const mine = (key === "pay" && st === "now") || (key === "pax" && st !== "done");
              return (
                <li className={st} key={key}>
                  <span className="dot" aria-hidden="true" />
                  <div>
                    <div className="cn">{name}{mine && <span className="yours">Your step</span>}</div>
                    <div className="cs">{stepSub(x, key, st)}</div>
                    {key === "pay" && st === "now" && <button className="mini" type="button" onClick={() => setSheet({ kind: "pay", f: x })}>Pay now</button>}
                    {key === "pax" && st !== "done" && <button className="mini ghost" type="button" onClick={() => setSheet({ kind: "pax", f: x })}>Add names and passports</button>}
                    {key === "brief" && st === "done" && x.brief && <button className="mini ghost" type="button" onClick={() => setSheet({ kind: "brief", f: x })}>Open the flight brief</button>}
                  </div>
                </li>
              );
            })}
          </ol>
          {x.note && <div className="pnote">{x.note}<div className="by">Your Dedicated Advisor</div></div>}
          <div className="docs">Documents: {docs(x).map((n, i) => <span key={n}>{i ? " · " : ""}<span>{n}</span></span>)}</div>
        </div>
      ))}
      {past && past.length > 0 && (
        <>
          <h4 style={{ marginTop: 30 }}>Past flights</h4>
          {past.map((p) => (
            <div className="past" key={p.date + p.route}>
              <span><b style={{ color: "var(--navy)", fontWeight: 500 }}>{p.route}</b> · {p.standard}</span><span>{p.price}</span>
              <span className="d">{longDate(p.date)} · {p.pax} guests. {p.line}</span>
            </div>
          ))}
        </>
      )}
      {sheet?.kind === "pay" && <PaySheet f={sheet.f} demo={demo} onClose={() => setSheet(null)} />}
      {sheet?.kind === "pax" && <PaxSheet f={sheet.f} demo={demo} onClose={() => setSheet(null)} />}
      {sheet?.kind === "brief" && <BriefSheet f={sheet.f} onClose={() => setSheet(null)} />}
    </>
  );
}

function PaySheet({ f, demo, onClose }: { f: ClientFlight; demo: boolean; onClose: () => void }) {
  const [method, setMethod] = useState<"bank" | "card">("bank");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function pay() {
    if (demo) { setMsg("Demo: no payment is taken."); return; }
    setBusy(true);
    const r = await payBooking(f.ref, method);
    setBusy(false);
    if (!r.ok) return setMsg(r.error);
    if (r.url) { window.location.href = r.url; return; }
    setMsg(r.note ?? "Done.");
    router.refresh();
  }
  return (
    <Modal onClose={onClose} label="Payment">
      <div className="eyebrow">Payment · {f.ref}</div>
      <h3>{priceText(f)}</h3>
      <p>{f.fromCity} to {f.toCity}, {longDate(f.date)}. You pay MyPrivate-Jet only; we pay the operator.</p>
      <div className="paym">
        <label><input type="radio" name="pm" checked={method === "bank"} onChange={() => setMethod("bank")} /><span><b>Bank transfer</b>Our account details and your reference {f.ref} come with the invoice.</span></label>
        <label><input type="radio" name="pm" checked={method === "card"} onChange={() => setMethod("card")} /><span><b>Card</b>Visa, Mastercard or American Express, through a secure payment page.</span></label>
      </div>
      {msg ? <p>{msg}</p> : <button className="btn" type="button" onClick={pay} disabled={busy}>{method === "card" ? `Pay ${priceText(f)}` : "Send me the invoice"}</button>}
    </Modal>
  );
}

function PaxSheet({ f, demo, onClose }: { f: ClientFlight; demo: boolean; onClose: () => void }) {
  const [names, setNames] = useState(f.names);
  const [pp, setPp] = useState(f.passports);
  const [busyI, setBusyI] = useState<number | null>(null);
  const [keep, setKeep] = useState(f.keep);
  const router = useRouter();
  function addPassport(i: number) {
    // Reading is simulated until the document reader is connected: the file never leaves this device.
    setBusyI(i);
    setTimeout(() => { setPp((p) => p.map((v, j) => (j === i ? true : v))); setBusyI(null); }, 900);
  }
  async function save() {
    if (!demo) await savePassengers(f.ref, names, pp, keep);
    onClose();
    router.refresh();
  }
  return (
    <Modal onClose={onClose} label="Passengers">
      <div className="eyebrow">Passengers · {f.ref}</div>
      <h3>Who is flying?</h3>
      <p>Add each name and a photo or scan of the passport. The details are read automatically, so there is nothing to type.</p>
      {names.map((n, i) => (
        <div key={i}>
          <div className="pxr">
            <label className="fld">Guest {i + 1}<input value={n} onChange={(e) => setNames((a) => a.map((v, j) => (j === i ? e.target.value : v)))} autoComplete="off" /></label>
            <label className={`ppu ${pp[i] ? "ok" : ""} ${busyI === i ? "busy" : ""}`}>
              <input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e) => e.target.files?.[0] && addPassport(i)} />
              <span className="pp-ic" aria-hidden="true" /><span className="pp-t">{busyI === i ? "Reading…" : pp[i] ? "Passport added" : "Add passport"}</span>
            </label>
          </div>
          <div className="pp-s">{pp[i] ? "Read automatically: name, nationality, number and expiry." : ""}</div>
        </div>
      ))}
      <label className="pchk" style={{ marginTop: 14 }}><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> Keep these passports on file for future flights</label>
      <p className="fine" style={{ margin: "0 0 16px" }}>Passports are encrypted, shared only with the operator and border authorities for this flight, and deleted after landing unless you keep them on file. Test mode: passport reading is simulated and the image never leaves your device.</p>
      <button className="btn" type="button" onClick={save}>Save</button>
    </Modal>
  );
}

function BriefSheet({ f, onClose }: { f: ClientFlight; onClose: () => void }) {
  const B = f.brief ?? {};
  const r = (l: string, v?: string) => (v ? <div className="pr-r" key={l}><span>{l}</span><div>{v}</div></div> : null);
  return (
    <Modal onClose={onClose} label="Flight brief">
      <div className="pv-head"><div className="brand" style={{ fontSize: 20 }}>MyPrivate<b>·</b>Jet</div><div className="eyebrow">Flight brief · {f.ref}</div></div>
      <h3 className="pv-t">{f.fromCity} to {f.toCity}</h3>
      <p className="sub" style={{ margin: "0 0 14px" }}>{B.date ?? longDate(f.date)}{B.etd ? ` · departs ${B.etd}` : ""}{B.eta ? ` · arrives ${B.eta} local` : ""}</p>
      <div className="pv-s"><h5>Your aircraft</h5>{r("Aircraft", B.actype)}{r("Registration", B.reg)}{r("Flight time", B.ftime)}</div>
      <div className="pv-s"><h5>Departure</h5>{r("Airport", B.dep_ap)}{r("Terminal", B.dep_fbo)}{r("Address", B.dep_addr)}{r("Phone", B.dep_phone)}{r("Please arrive", B.dep_show)}{r("Access", B.dep_notes)}{r("Your car", B.car)}</div>
      <div className="pv-s"><h5>Arrival</h5>{r("Airport", B.arr_ap)}{r("Terminal", B.arr_fbo)}{r("Address", B.arr_addr)}{r("Phone", B.arr_phone)}{r("On arrival", B.arr_notes)}</div>
      <div className="pv-s"><h5>Your crew</h5>{r("Captain", B.capt)}{r("First officer", B.fo)}{r("Cabin attendant", B.ca)}</div>
      <div className="pv-s"><h5>On board</h5>{r("Guests", B.pax)}{r("Luggage", B.bags)}{r("Catering", B.cater)}{r("Weather", B.wx)}</div>
      {B.comment && <div className="pv-s"><h5>From your advisor</h5><p style={{ margin: 0, fontSize: 13.5 }}>{B.comment}</p></div>}
    </Modal>
  );
}
