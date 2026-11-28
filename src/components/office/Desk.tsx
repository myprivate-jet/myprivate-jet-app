import "server-only";
import { airport } from "@/lib/pricing/airports";
import { hm, makeTrip, MODEL_INFO, price, screen } from "@/lib/pricing/engine";
import { nextEvents } from "@/lib/pricing/knowledge";
import { STANDARDS } from "@/lib/pricing/standards";
import { money } from "@/lib/format";

const REF_ROUTES: [string, string][] = [["LSGG", "LFMN"], ["LFPB", "LFMN"], ["EGLF", "LSGG"], ["EGLF", "LEIB"], ["LFPB", "LGMK"], ["KTEB", "KPBI"], ["KTEB", "KASE"], ["EGLF", "KTEB"]];
const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** The MPJ Private Aviation Desk: Bloomberg-style, fixed dark palette. */
export function Desk() {
  const today = new Date();
  const d30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const ev = nextEvents(today);
  const nx = ev[0];
  const days = (d: Date) => Math.max(0, Math.ceil((+d - +today) / 864e5));
  const rows = REF_ROUTES.map(([f, t]) => {
    const a = airport(f), b = airport(t);
    if (!a || !b) return null;
    const trip = makeTrip({ from: f, to: t, date: d30, time: "10:00", pax: 4, ret: false, bags: "std", standUp: false, attendant: false, pets: false }, a, b);
    const cell = (s: "signature" | "distinction" | "privilege") => { const r = screen(s, trip); return r.st === "ok" ? money(price(s, trip).assured, trip.cur) : r.st === "adv" ? "Advisor" : "–"; };
    return { route: `${f}–${t}`, sig: cell("signature"), dis: cell("distinction"), pri: cell("privilege"), ft: hm(trip.km / STANDARDS.distinction.speed + 0.3) };
  }).filter(Boolean) as { route: string; sig: string; dis: string; pri: string; ft: string }[];
  const lvl = MODEL_INFO.levelVs2025;
  return (
    <div className="desk" role="region" aria-label="Private aviation desk">
      <div className="dt"><span>MPJ Private Aviation Desk</span><span>{today.toISOString().slice(0, 10)} · source: MyPrivate-Jet pricing record</span></div>
      <div className="kpis">
        <div><div className="k">Charter level vs 2025</div><div className="v up">+{lvl}%</div><div className="s">all routes, like for like</div></div>
        <div><div className="k">Same-trip quote spread</div><div className="v">1.48×</div><div className="s">highest vs lowest offer, median</div></div>
        <div><div className="k">Trips on record</div><div className="v">{MODEL_INFO.trainedOn.toLocaleString("en-GB")}</div><div className="s">priced 2025–2026, EU and US</div></div>
        <div><div className="k">Next peak</div><div className="v">{nx ? (nx.start <= today ? "Now" : `${days(nx.start)} d`) : "–"}</div><div className="s">{nx?.event.name.replace(/^the /, "")}</div></div>
      </div>
      <div className="dcols">
        <div>
          <h5>Reference routes · Assured Price · 4 guests · one way · in 30 days</h5>
          <div className="dtbl"><table><thead><tr><th>Route</th><th style={{ textAlign: "right" }}>Signature</th><th style={{ textAlign: "right" }}>Distinction</th><th style={{ textAlign: "right" }}>Privilege</th><th style={{ textAlign: "right" }}>Flight</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.route}><td>{r.route}</td><td className="n">{r.sig}</td><td className="n">{r.dis}</td><td className="n">{r.pri}</td><td className="n">{r.ft}</td></tr>)}</tbody></table></div>
        </div>
        <div>
          <h5>Demand calendar · confirm by</h5>
          <div className="dtbl"><table className="cal"><thead><tr><th>Period</th><th>Dates</th><th>Where</th><th>Confirm by</th></tr></thead>
            <tbody>{ev.slice(0, 6).map((x) => {
              const by = new Date(+x.start - 42 * 864e5), late = by <= today;
              const where = x.event.airports ? [...new Set(x.event.airports.map((c) => airport(c)?.[3] || c))].slice(0, 3).join(", ") : "All regions";
              const name = x.event.name.replace(/^the /, "");
              return <tr key={x.event.name}><td>{name.charAt(0).toUpperCase() + name.slice(1)}</td><td>{fmt(x.start)}–{fmt(x.end)}</td><td>{where}</td><td className={late ? "now" : "hot"}>{late ? "Now" : fmt(by)}</td></tr>;
            })}</tbody></table></div>
        </div>
      </div>
      <div className="brief-l">
        <h5>Office briefings</h5>
        <div className="it"><span className="tag">Prices</span><span><b>Charter prices run about {lvl}% above 2025</b> on comparable trips in our record. Every Assured Price already reflects today&apos;s level.</span></div>
        <div className="it"><span className="tag">Method</span><span><b>Why one price.</b> On the same trip, the highest operator offer was typically about 1.5 times the cheapest. Comparing quotes means carrying that risk; an Assured Price removes it.</span></div>
        <div className="it"><span className="tag">United States</span><span><b>Federal transport tax</b> of 7.5% plus $5.30 per passenger per segment is included in every US Assured Price.</span></div>
        <div className="it"><span className="tag">United Kingdom</span><span><b>Air Passenger Duty for private jets changes from April 2027.</b> We brief you before any UK departure booked after that date.</span></div>
        <div className="it"><span className="tag">Season</span><span><b>Winter operations:</b> morning departures can need 15 to 30 minutes of de-icing. We build it into your timing.</span></div>
      </div>
      <div className="wire">LIVE WIRE · Not connected yet. Market headlines from a licensed news source will stream here, filtered by your advisor for what affects your flights.</div>
    </div>
  );
}
