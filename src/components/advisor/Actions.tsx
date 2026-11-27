"use client";
import { useState, useTransition } from "react";
import { advanceStage, approveOperatorPayment, chooseOffer, resolveException, setAdvisorPrice } from "@/server/actions/advisor";

function useAct() {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const run = (fn: () => Promise<unknown>) => start(async () => { setErr(""); try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); } });
  return { pending, err, run };
}

export function ChooseOffer({ refId, offerId, label }: { refId: string; offerId: string; label: string }) {
  const { pending, err, run } = useAct();
  return <>{<button className="mini" type="button" disabled={pending} onClick={() => run(() => chooseOffer(refId, offerId))}>{label}</button>}{err && <div className="st2 over">{err}</div>}</>;
}

export function ApprovePayout({ refId }: { refId: string }) {
  const { pending, err, run } = useAct();
  return <><button className="btn" type="button" disabled={pending} onClick={() => run(() => approveOperatorPayment(refId))}>Approve operator payment</button>{err && <div className="err">{err}</div>}</>;
}

export function AdvanceStage({ refId }: { refId: string }) {
  const { pending, run } = useAct();
  return <button className="so" type="button" disabled={pending} onClick={() => run(() => advanceStage(refId))}>Test mode: run the next automatic step</button>;
}

export function SetPrice({ refId, currency }: { refId: string; currency: string }) {
  const { pending, err, run } = useAct();
  const [v, setV] = useState("");
  return (
    <div className="exc">
      <h3 className="ah" style={{ marginTop: 8 }}>Set one final price</h3>
      <p className="sub" style={{ fontSize: 13.5 }}>Outside automatic pricing. The client sees one final price and approves with one tap. Rounded up to 100.</p>
      <div className="inline"><label className="fld">Price, {currency}<input inputMode="numeric" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, ""))} /></label>
        <button className="mini" type="button" disabled={pending || !v} onClick={() => run(() => setAdvisorPrice(refId, +v))}>Set price and start sourcing</button></div>
      {err && <div className="err">{err}</div>}
    </div>
  );
}

export function ExceptionPanel({ refId, standardName, upgradeName, upgradeLine, newPriceLine, suggestedNewPrice }: { refId: string; standardName: string; upgradeName: string; upgradeLine: string; newPriceLine: string; suggestedNewPrice: number }) {
  const { pending, err, run } = useAct();
  return (
    <div className="exc">
      <h3 className="ah" style={{ marginTop: 8 }}>Exception: confirmed or free</h3>
      <p className="sub" style={{ fontSize: 13.5 }}>No audited offer of {standardName} at or below our price. The system prepared three answers. The client sees one, with one tap.</p>
      <div className="exo">
        <div><b>1 · Upgrade at the same price</b><span>{upgradeName}: {upgradeLine} No extra cost to us.</span><button className="mini" type="button" disabled={pending} onClick={() => run(() => resolveException(refId, "upgrade"))}>Offer upgrade (suggested)</button></div>
        <div><b>2 · One new final price</b><span>{newPriceLine} The client accepts or declines with one tap.</span><button className="mini ghost" type="button" disabled={pending} onClick={() => run(() => resolveException(refId, "newprice", suggestedNewPrice))}>Send new price</button></div>
        <div><b>3 · Release at no cost</b><span>Nothing was paid. The booking ends with a short personal note.</span><button className="mini ghost" type="button" disabled={pending} onClick={() => run(() => resolveException(refId, "release"))}>Release</button></div>
      </div>
      {err && <div className="err">{err}</div>}
    </div>
  );
}
