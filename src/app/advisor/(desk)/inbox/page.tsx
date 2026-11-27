import Link from "next/link";
import { advisorInbox } from "@/server/queries";
import { Reply } from "@/components/advisor/Reply";

export default async function Inbox({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const [threads, sp] = await Promise.all([advisorInbox(), searchParams]);
  const sel = threads.find((t) => t.memberId === sp.m) ?? threads[0];
  return (
    <>
      <div className="om"><div><div className="eyebrow">Internal · Client messages</div><h1 className="oh">Direct chat</h1><p className="sub" style={{ margin: 0 }}>Every client reaches their Dedicated Advisor here, from any page of the app.</p></div></div>
      {!threads.length ? <p className="sub">No messages yet.</p> : (
        <div className="inbox">
          <div>{threads.map((t) => <Link key={t.memberId} className={`t ${sel?.memberId === t.memberId ? "on" : ""}`} href={`/advisor/inbox?m=${t.memberId}`}><b>{t.client}</b>{t.unread > 0 && <span className="badge">{t.unread}</span>}<span>{t.last.body}</span></Link>)}</div>
          {sel && (
            <div>
              <div className="thread" style={{ padding: 0, maxHeight: 520 }}>
                {sel.messages.map((m) => (
                  <div key={m.id} className={`bub ${m.author === "advisor" ? "c" : "p"}`} style={{ whiteSpace: "pre-line" }}>
                    {m.context && <div className="st2">Shared trip: {m.context}</div>}
                    {m.body}
                    <div className="st2" style={{ color: "inherit", opacity: 0.7 }}>{m.createdAt.toISOString().slice(0, 16).replace("T", " ")}</div>
                  </div>
                ))}
              </div>
              <Reply memberId={sel.memberId} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
