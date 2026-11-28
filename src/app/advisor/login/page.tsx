"use client";
import { useActionState } from "react";
import { staffLogin } from "@/server/actions/advisor";

export default function AdvisorLogin() {
  const [s, act, busy] = useActionState(staffLogin, null);
  return (
    <div className="wrap">
      <form className="login" action={act}>
        <div className="brand" style={{ marginBottom: 24 }}>MyPrivate<b>·</b>Jet<small>Advisor desk · internal</small></div>
        <label className="fld">Email<input name="email" type="email" autoComplete="username" required /></label>
        <label className="fld">Password<input name="password" type="password" autoComplete="current-password" required /></label>
        <div className="err" role="alert">{s && !s.ok ? s.error : ""}</div>
        <button className="btn" type="submit" disabled={busy}>Sign in</button>
      </form>
    </div>
  );
}
