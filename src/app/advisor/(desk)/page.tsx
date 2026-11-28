import Link from "next/link";
import { bookingDetail, pipeline } from "@/server/queries";
import { aiAvailable } from "@/server/integrations/ai";
import { airport, cityOf } from "@/lib/pricing/airports";
import { haversineKm, hm, up100 } from "@/lib/pricing/engine";
import { ORDER, STANDARDS, type StandardId } from "@/lib/pricing/standards";
import { STAGES, STAGE_DESCRIPTIONS } from "@/lib/booking/stages";
import { longDate, money, shortDate } from "@/lib/format";
import { AdvanceStage, ApprovePayout, ChooseOffer, ExceptionPanel, SetPrice, TierToggle } from "@/components/advisor/Actions";
import { BriefBuilder } from "@/components/advisor/BriefBuilder";
import { MailTab } from "@/components/advisor/MailTab";

const RULES: [string, string][] = [
  ["No offer at our price", "After 90 minutes: look one standard up at no extra cost to us; otherwise prepare one new price or a release. You send one with one click. We never absorb an overrun."],
  ["New request", "Price with the model, screen eligibility, route outliers to you with a 2-hour SLA."],
  ["Client books", "Send RFQ to qualified operators only. Rank offers on arrival. Pre-select the best."],
  ["Offer chosen", "Generate the charter agreement and e-sign it under the client's mandate. Send the payment link."],
  ["Payment", "Reconcile from the bank feed. Remind the client at T-7 days. Alert you at T-5 if unpaid."],
  ["Operator invoice", "Match to the agreement. Queue for your one-click approval."],
  ["T-48 h", "Build and send the flight brief to the client and crew. Check passenger names are complete."],
  ["Day of flight", "Watch the flight. If the operator fails, alert you with the next best offer of the same or higher standard."],
  ["After landing", "Send invoice and receipt, ask for feedback, book the margin, update the client's preferences."],
];

export default async function AdvisorDesk({ searchParams }: { searchParams: Promise<{ b?: string; tab?: string }> }) {
  const sp = await searchParams;
  const list = await pipeline();
  const selRef = sp.b ?? list.find((b) => b.needsAdvisor)?.ref ?? list[0]?.ref;
  const d = selRef ? await bookingDetail(selRef) : null;
  const tab = sp.tab === "brief" || sp.tab === "mail" ? sp.tab : "ov";
  const today = new Date();
  const need = list.filter((b) => b.needsAdvisor);
  const sum = (arr: typeof list) => arr.reduce((s, b) => s + (b.price ?? 0), 0);
  const soon = list.filter((b) => { const x = (+new Date(b.date + "T12:00:00") - +today) / 864e5; return x >= 0 && x <= 3; });

  return (
    <>
      <div className="om">
        <div><div className="eyebrow">Internal · Advisor dashboard</div><h1 className="oh">Today, {today.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</h1><p className="sub" style={{ margin: 0 }}>9 of 12 steps run without you. You act only where a decision or an approval is needed.</p></div>
      </div>
      <div className="akpi">
        <div><span>Need you now</span><b>{need.length}</b></div>
        <div><span>Awaiting client payment</span><b>{money(sum(list.filter((b) => b.stage === 6)), "EUR")}</b></div>
        <div><span>Due to operators</span><b>{money(list.filter((b) => b.stage === 7).reduce((s, b) => s + (b.chosenCost ?? 0), 0), "EUR")}</b></div>
        <div><span>Flights in the next 72 h</span><b>{soon.length}</b></div>
        <div><span>Reserve, 2% of bookings</span><b>{money(Math.round(sum(list) * 0.02), "EUR")}</b></div>
      </div>

      <h3 className="ah">Pipeline</h3>
      {!list.length && <p className="sub">No bookings yet. Run <code>npm run db:seed</code> for sample bookings, or book a flight in the client app.</p>}
      <div className="atb">
        <table className="pipe">
          <thead><tr><th>Ref</th><th>Client</th><th>Trip</th><th>Standard</th><th className="n">Assured</th><th>Stage</th><th>Next</th><th>SLA</th></tr></thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.ref} className={b.ref === selRef ? "sel" : ""}>
                <td><Link href={`/advisor?b=${b.ref}&tab=${tab}`}>{b.ref}</Link></td>
                <td>{b.client}</td>
                <td>{b.fromIcao}–{b.toIcao} · {shortDate(b.date)}</td>
                <td>{b.upgradedTo ? `${STANDARDS[b.upgradedTo as StandardId]?.name.replace("The ", "")}, upgraded` : STANDARDS[b.standard as StandardId]?.name.replace("The ", "")}</td>
                <td className="n">{b.price != null ? money(b.price, b.currency) : "To price"}</td>
                <td><span className="sbar" title={STAGES[b.stage]?.name}>{STAGES.map((s, i) => <i key={s.key} className={i < b.stage ? "d" : i === b.stage ? "n" : ""} />)}</span><div className="st2">{STAGES[b.stage]?.name}</div></td>
                <td>{b.needsAdvisor ? <b className="you">You: {b.needsAdvisor}</b> : <span className="auto">Auto: {b.waitingOn ?? ""}</span>}</td>
                <td className="sla">{b.sla ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {d && (
        <>
          <div className="atabs" role="tablist">
            {[["ov", "Overview"], ["brief", "Flight brief"], ["mail", "Operator mail"]].map(([k, n]) => <Link key={k} role="tab" aria-selected={tab === k} href={`/advisor?b=${d.booking.ref}&tab=${k}`} style={{ textDecoration: "none" }}><button type="button" className={tab === k ? "on" : ""} tabIndex={-1}>{n}</button></Link>)}
            <span className="st2">{d.booking.ref} · {d.member.firstName.charAt(0)}. {d.member.lastName} · {cityOf(d.booking.fromIcao)} to {cityOf(d.booking.toIcao)}</span>
          </div>
          {tab === "brief" ? <Brief d={d} /> : tab === "mail" ? <MailTab refId={d.booking.ref} operator={d.booking.operatorName} mail={d.mail} /> : <Overview d={d} />}
        </>
      )}

      <h3 className="ah" style={{ marginTop: 56 }}>Automation rules</h3>
      <div className="rules">{RULES.map(([a, b]) => <div key={a}><b>{a}</b><span>{b}</span></div>)}</div>
    </>
  );
}

type D = NonNullable<Awaited<ReturnType<typeof bookingDetail>>>;

function Overview({ d }: { d: D }) {
  const b = d.booking;
  const std = (b.upgradedTo ?? b.standard) as StandardId;
  const cap = b.price ?? 0;
  // Assured: aircraft built in the last 7 years (or refurbished in the last 2: check the offer). Private: no age limit.
  const assuredAge = d.member.tier === "assured";
  const minYear = assuredAge ? new Date().getFullYear() - 7 : 0;
  const ok = d.offers.filter((o) => o.audited && o.year >= minYear && o.cost <= cap).sort((x, y) => x.cost - y.cost);
  const pick = ok[0];
  const chosen = d.offers.find((o) => o.status === "chosen");
  const out = chosen?.cost ?? pick?.cost ?? 0;
  const prof = d.profile as Record<string, string | boolean>;
  const paidIn = d.payments.find((p) => p.direction === "in" && p.status === "received");
  const exception = b.stage === 4 && b.price != null && d.offers.length > 0 && !ok.length && !b.upgradedTo;
  const nextStd = ORDER[ORDER.indexOf(std) + 1];
  const cheapest = d.offers.filter((o) => o.audited).sort((x, y) => x.cost - y.cost)[0];
  return (
    <div className="adet">
      <div>
        <h3 className="ah">{b.ref} · {d.member.firstName.charAt(0)}. {d.member.lastName} · {cityOf(b.fromIcao)} to {cityOf(b.toIcao)}</h3>
        <p className="sub" style={{ margin: "0 0 6px" }}><TierToggle memberId={d.member.id} tier={d.member.tier} requested={Boolean(d.member.assuredRequestedAt)} /></p>
        <p className="sub" style={{ margin: "0 0 14px" }}>{longDate(b.date)} at {b.time} · {b.pax} guests · {STANDARDS[std]?.name}{b.flags.length ? <> · <span className="flag">{b.flags.join(" · ")}</span></> : null}</p>
        <ol className="tl">
          {STAGES.map((s, i) => <li key={s.key} className={i < b.stage ? "d" : i === b.stage ? "n" : ""}><span className={`tw ${s.who.toLowerCase()}`}>{s.who}</span><div><b>{s.name}</b><span>{STAGE_DESCRIPTIONS[s.key]}</span></div></li>)}
        </ol>
        <p style={{ marginTop: 12 }}><AdvanceStage refId={b.ref} /></p>
      </div>
      <div>
        {!b.priceAcceptedAt && b.stage <= 1 && <SetPrice refId={b.ref} currency={b.currency} estimate={b.estimate} sent={b.price} />}
        <h3 className="ah">Offers received</h3>
        {!d.offers.length && b.stage < 3 ? <p className="sub">Sourcing starts when the request arrives.</p> : !d.offers.length ? <p className="sub">Waiting for operator replies to the RFQ.</p> : (
          <div className="atb">
            <table className="offers">
              <thead><tr><th>Operator</th><th>Aircraft</th><th>Year</th><th>Audit</th><th className="n">Cost</th><th className="n">Margin</th><th /></tr></thead>
              <tbody>
                {d.offers.map((o) => {
                  const m = cap - o.cost;
                  return (
                    <tr key={o.id} className={`${(chosen ? chosen.id === o.id : pick?.id === o.id) ? "pick" : ""} ${!o.audited ? "na" : ""}`}>
                      <td>{o.operatorName}<div className="st2">{o.base}</div></td><td>{o.aircraft}</td><td>{o.year}</td>
                      <td>{o.audited ? "On file" : "Missing"}{o.audited && o.cost > cap && <div className="st2 over">Above our price</div>}</td>
                      <td className="n">{money(o.cost, o.currency)}</td><td className="n">{money(m, o.currency)}<div className="st2">{cap ? Math.round((m / cap) * 100) : 0}%</div></td>
                      <td>{!o.audited ? <span className="st2">Excluded</span> : chosen ? <span className="st2">{chosen.id === o.id ? "Chosen" : ""}</span> : o.cost > cap ? <span className="st2">Not without your approval</span> : b.stage === 4 ? <ChooseOffer refId={b.ref} offerId={o.id} label={pick?.id === o.id ? "Choose (suggested)" : "Choose"} /> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {d.offers.length > 0 && <p className="fine">Suggestion rule: lowest cost with an audit on file, {assuredAge ? "aircraft built in the last 7 years or refurbished in the last 2 (Assured)" : "any suitable aircraft (Private, no age limit)"}, crew qualified for both airports, and at or below the Assured Price ({money(cap, b.currency)}). We absorb nothing.</p>}
        {exception && nextStd && cheapest && (
          <ExceptionPanel
            refId={b.ref}
            standardName={STANDARDS[std].name}
            upgradeName={STANDARDS[nextStd].name}
            upgradeLine={`look for a ${STANDARDS[nextStd].examples.split(",")[0]} at or below ${money(up100(cap * 0.95), b.currency)}, keeping a margin.`}
            newPriceLine={`${money(up100(cheapest.cost / 0.82), b.currency)} with ${cheapest.operatorName} (${cheapest.year}).`}
            suggestedNewPrice={up100(cheapest.cost / 0.82)}
          />
        )}
        <h3 className="ah">Money</h3>
        <div className="ledger">
          <div><span>In · from client</span><b>{b.price != null ? money(b.price, b.currency) : "–"}</b><em>{paidIn ? `Received (${paidIn.method})` : b.stage === 6 ? "Requested" : "Not yet requested"}</em></div>
          <div><span>Out · to operator</span><b>{out ? money(out, b.currency) : "–"}</b><em>{b.stage > 7 ? "Paid" : b.stage === 7 ? "Awaiting your approval" : "After client payment"}</em></div>
          <div><span>Gross margin</span><b>{b.price && out ? money(b.price - out, b.currency) : "–"}</b><em>{b.price && out ? `${Math.round(((b.price - out) / b.price) * 100)}% of the Assured Price` : ""}</em></div>
        </div>
        {b.stage === 7 && <ApprovePayout refId={b.ref} />}
        <h3 className="ah">Sent to the operator automatically</h3>
        <p className="sub" style={{ fontSize: 13.5 }}>{prof.drinks || prof.diet || prof.pet ? `Catering: ${[prof.drinks, prof.diet, prof.cater].filter(Boolean).join("; ")}. ${prof.pet ? `Pet: ${prof.pet}${prof.petw ? `, ${prof.petw}` : ""}. ` : ""}${prof.cardep ? "Car at the aircraft on departure" : ""}${prof.cararr ? " and arrival" : ""}.` : "Catering, pets and ground requests from the client profile, plus passenger names when complete."}</p>
        <p className="sub" style={{ fontSize: 13.5 }}>Passengers: {b.passengers.filter((p) => p.fullName).length} of {b.pax} named, {b.passengers.filter((p) => p.passportStatus === "read").length} passports read.</p>
        <h3 className="ah">Documents</h3>
        <p className="sub" style={{ fontSize: 13.5 }}>{["Booking instruction (client, under mandate)"].concat(b.stage > 5 ? ["Charter agreement, e-signed under mandate"] : []).concat(b.stage >= 6 ? ["Client invoice"] : []).concat(b.stage >= 7 ? ["Operator invoice"] : []).concat(b.briefSent ? ["Flight brief"] : []).join(" · ")}</p>
        {d.audit.length > 0 && <><h3 className="ah">Audit trail</h3><div className="st2">{d.audit.map((a) => <div key={a.id}>{a.createdAt.toISOString().slice(0, 16).replace("T", " ")} · {a.actor} · {a.action}</div>)}</div></>}
      </div>
    </div>
  );
}

function Brief({ d }: { d: D }) {
  const b = d.booking;
  const a = airport(b.fromIcao), z = airport(b.toIcao);
  const std = (b.upgradedTo ?? b.standard) as StandardId;
  const ft = a && z ? hm(haversineKm(a, z) / STANDARDS[std].speed + 0.3) : "";
  const prof = d.profile as Record<string, string | boolean>;
  const names = b.passengers.map((p) => p.fullName).filter(Boolean).join(", ");
  const base: Record<string, string> = {
    date: longDate(b.date), etd: b.time, ftime: ft, actype: b.aircraft ?? "", operator: b.operatorName ?? "",
    dep_ap: `${cityOf(b.fromIcao)} (${b.fromIcao})`, arr_ap: `${cityOf(b.toIcao)} (${b.toIcao})`,
    pax: `${b.pax} guests: ${names || "names pending"}`,
    cater: [prof.drinks, prof.diet, prof.cater].filter(Boolean).join(". "),
    car: prof.cardep || prof.cararr ? `Car at the aircraft${prof.cardep ? " on departure" : ""}${prof.cararr ? " and arrival" : ""}` : "",
  };
  return <BriefBuilder refId={b.ref} title={`${cityOf(b.fromIcao)} to ${cityOf(b.toIcao)}`} initial={{ ...base, ...(d.brief?.fields ?? {}) }} fromOperator={d.brief?.fromOperator ?? []} sent={Boolean(d.brief?.sentAt)} aiReady={aiAvailable()} />;
}
