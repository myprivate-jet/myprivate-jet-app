"use client";
import { useActionState, useEffect, useRef } from "react";
import { confirmMembership, startMembership } from "@/server/actions/member";
import { MANDATE_POINTS, MANDATE_TICK } from "@/lib/booking/terms";
import { track } from "@/lib/analytics";

const CODES = ["+41", "+44", "+33", "+356", "+1", "+971", "+966", "+974", "+49", "+39", "+377", "+34", "+31", "+32", "+352", "+43", "+7", "+65", "+852", "+61"];

/** Membership in two steps: details plus one tick, then the SMS code. */
export function MembershipForm({ onDone }: { onDone: () => void }) {
  const [s1, send, sending] = useActionState(startMembership, null);
  const [s2, verify, verifying] = useActionState(confirmMembership, null);
  const first = useRef<HTMLInputElement>(null);
  const code = useRef<HTMLInputElement>(null);
  const step2 = s1?.ok === true;

  useEffect(() => { (step2 ? code : first).current?.focus(); }, [step2]);
  useEffect(() => { if (step2) track("membership_started"); }, [step2]);
  useEffect(() => { if (s2?.ok) { track("membership_completed"); onDone(); } }, [s2, onDone]);

  if (!step2)
    return (
      <form action={send} noValidate>
        <div className="eyebrow">Membership</div>
        <h3 id="vt">Become a member. Two steps, once.</h3>
        <p>Your details stay private and are used only to arrange your flights.</p>
        <div className="row2b">
          <label className="fld">First name<input ref={first} name="first" autoComplete="given-name" required /></label>
          <label className="fld">Family name<input name="last" autoComplete="family-name" required /></label>
        </div>
        <label className="fld">Email<input name="email" type="email" autoComplete="email" required /></label>
        <div className="row2">
          <label className="fld">Country<select name="cc" defaultValue="+41">{CODES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="fld">Mobile<input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required /></label>
        </div>
        <label className="pchk tc"><input type="checkbox" name="terms" /> <span>{MANDATE_TICK}</span></label>
        <details className="terms">
          <summary>What the mandate means</summary>
          <ul>{MANDATE_POINTS.map((p) => <li key={p}>{p}</li>)}</ul>
          <p className="fine">Draft wording, pending legal review. <a href="/membership-terms" target="_blank">Read the Membership Terms</a>.</p>
        </details>
        <div className="err" role="alert">{s1 && !s1.ok ? s1.error : ""}</div>
        <button className="btn" type="submit" disabled={sending}>{sending ? "Sending…" : "Send my code by SMS"}</button>
      </form>
    );

  return (
    <form action={verify} noValidate>
      <div className="eyebrow">Mobile verification</div>
      <h3>Enter the 6-digit code</h3>
      <p>We sent a code by SMS to {s1.masked}. It is valid for 10 minutes.</p>
      <label className="fld">Code<input ref={code} name="code" className="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} /></label>
      <div className="err" role="alert">{s2 && !s2.ok ? s2.error : ""}</div>
      <button className="btn" type="submit" disabled={verifying}>{verifying ? "Checking…" : "Verify and continue"}</button>
      {s1.simulated && <div className="fine">Test mode: SMS is not connected yet, so any 6 digits work.</div>}
    </form>
  );
}

export function Modal({ onClose, children, label }: { onClose: () => void; children: React.ReactNode; label?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="veil" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={label}>
        <div className="xwrap"><button className="x" type="button" aria-label="Close" onClick={onClose}>&times;</button></div>
        {children}
      </div>
    </div>
  );
}

export function MembershipDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  return (
    <Modal onClose={onClose} label="Membership">
      <MembershipForm onDone={onDone} />
    </Modal>
  );
}
