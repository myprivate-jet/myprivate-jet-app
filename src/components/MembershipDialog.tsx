"use client";
import { useActionState, useEffect, useRef } from "react";
import { confirmMembership, startMembership } from "@/server/actions/member";
import { MANDATE_CLICK } from "@/lib/booking/terms";
import { track } from "@/lib/analytics";

const CODES = ["+41", "+44", "+33", "+356", "+1", "+971", "+966", "+974", "+49", "+39", "+377", "+34", "+31", "+32", "+352", "+43", "+7", "+65", "+852", "+61"];

/** Membership in two steps: a name and a mobile, then the SMS code. Pressing Continue accepts the terms shown beside it. */
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
        <div className="eyebrow">First time only · free</div>
        <h3 id="vt">Your name and mobile.</h3>
        <p>That is all we need today. Passports and preferences can wait until after you book. Already with us? Use the same mobile.</p>
        <label className="fld">Your name<input ref={first} name="name" autoComplete="name" required /></label>
        <div className="row2">
          <label className="fld">Country<select name="cc" defaultValue="+41">{CODES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="fld">Mobile<input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required /></label>
        </div>
        <div className="err" role="alert">{s1 && !s1.ok ? s1.error : ""}</div>
        <button className="btn" type="submit" disabled={sending}>{sending ? "Sending…" : "Continue"}</button>
        <p className="fine clickwrap">We text you a code to confirm it is you. {MANDATE_CLICK} <a href="/membership-terms" target="_blank">Membership Terms</a>.</p>
      </form>
    );

  return (
    <form action={verify} noValidate>
      <div className="eyebrow">Last step</div>
      <h3>The code we just sent</h3>
      <p>We sent a code by SMS to {s1.masked}. It is valid for 10 minutes.</p>
      <label className="fld">Code<input ref={code} name="code" className="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} /></label>
      <div className="err" role="alert">{s2 && !s2.ok ? s2.error : ""}</div>
      <button className="btn" type="submit" disabled={verifying}>{verifying ? "Checking…" : "Continue"}</button>
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
