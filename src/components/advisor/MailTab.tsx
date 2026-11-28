"use client";
import { useState, useTransition } from "react";
import { draftOperatorMail, readBrief, sendOperatorMail } from "@/server/actions/advisor";

type Mail = { id: string; direction: "in" | "out"; fromName: string; toName: string | null; label: string | null; subject: string; body: string; attachment: string | null; aiNote: string | null };

export function MailTab({ refId, operator, mail }: { refId: string; operator: string | null; mail: Mail[] }) {
  const [text, setText] = useState("");
  const [st, setSt] = useState("Threaded by booking reference. The operator mailbox is not connected yet: messages are saved, not sent.");
  const [pending, start] = useTransition();
  return (
    <div className="mail">
      {mail.map((m) => (
        <div key={m.id} className={`ml ${m.direction}`}>
          <div className="mh"><b>{m.fromName}</b>{m.toName ? ` to ${m.toName}` : ""}<span>{m.label}</span></div>
          <div className="ms">{m.subject}</div>
          <p style={{ whiteSpace: "pre-line" }}>{m.body}</p>
          {m.attachment && <div className="att">📎 {m.attachment} <button className="mini" type="button" onClick={() => start(async () => { await readBrief(refId, new FormData()); setSt("Operator brief read into the flight brief tab."); })}>Read into flight brief</button></div>}
          {m.aiNote && <div className="ai">AI · {m.aiNote}</div>}
        </div>
      ))}
      <div className="compose">
        <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Write to ${operator ?? "the operator"}…`} />
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="mini ghost" type="button" disabled={pending} onClick={() => start(async () => { const r = await draftOperatorMail(refId); if (r.ok) { setText(r.text); setSt(r.ai ? "Drafted by AI from the booking and the missing brief fields. Edit, then send." : "Drafted from the booking and the missing brief fields (template; AI not connected). Edit, then send."); } })}>Draft with AI</button>
          <button className="mini" type="button" disabled={pending || !text.trim()} onClick={() => start(async () => { await sendOperatorMail(refId, text); setText(""); })}>Send</button>
          <span className="st2">{st}</span>
        </div>
      </div>
    </div>
  );
}
