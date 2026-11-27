"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadChat, sendChat } from "@/server/actions/member";
import { MembershipDialog } from "./MembershipDialog";
import { track } from "@/lib/analytics";

type Msg = { id: string; author: "member" | "advisor"; body: string; at: string };

/** "Chat with your Dedicated Advisor", visible at every step. Guests verify first. */
export function ChatWidget({ member, label, advisor }: { member: boolean; label: string; advisor: string }) {
  const [open, setOpen] = useState(false);
  const [gate, setGate] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [context, setContext] = useState<string | undefined>();
  const router = useRouter();
  const thread = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => setMsgs(await loadChat()), []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ context?: string; text?: string }>).detail ?? {};
      setContext(d.context);
      if (d.text) setText(d.text);
      if (!member) setGate(true);
      else setOpen(true);
      track("chat_opened");
    };
    window.addEventListener("mpj:chat", onOpen);
    return () => window.removeEventListener("mpj:chat", onOpen);
  }, [member]);

  useEffect(() => {
    if (!open) return;
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [open, refresh]);
  useEffect(() => { thread.current?.scrollTo(0, 1e6); }, [msgs]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text;
    setText("");
    setMsgs((m) => [...m, { id: "tmp" + Date.now(), author: "member", body, at: new Date().toISOString() }]);
    await sendChat(body, context);
    refresh();
  }

  return (
    <>
      {!open && (
        <button className="fab" type="button" aria-label={label} onClick={() => openChat()}>
          <span className="mono" aria-hidden="true">MJ</span><span className="fab-t">{label}</span>
        </button>
      )}
      {open && (
        <aside className="drawer" aria-label={label}>
          <div className="dh">
            <span className="mono" aria-hidden="true">MJ</span>
            <div><b>{advisor}</b>MyPrivate-Jet. {context ? "Your trip is already shared." : "Replies personally, usually within minutes."}</div>
            <button className="x" type="button" aria-label="Close chat" onClick={() => setOpen(false)}>&times;</button>
          </div>
          <div className="thread" ref={thread}>
            {context && <div className="ctx">Shared with your advisor: {context}</div>}
            {!msgs.length && <div className="bub p">Hello. Tell me what you have in mind, and I will come back with one aircraft and one price.</div>}
            {msgs.map((m) => <div key={m.id} className={`bub ${m.author === "member" ? "c" : "p"}`} style={{ whiteSpace: "pre-line" }}>{m.body}</div>)}
          </div>
          <form onSubmit={submit}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write to your advisor" aria-label="Message to your advisor" />
            <button className="btn" type="submit" style={{ marginTop: 0 }}>Send</button>
          </form>
        </aside>
      )}
      {gate && (
        <MembershipDialog
          onClose={() => setGate(false)}
          onDone={() => { setGate(false); router.refresh(); setOpen(true); }}
        />
      )}
    </>
  );
}

/** Open the advisor chat from anywhere, optionally sharing the trip. */
export function openChat(detail: { context?: string; text?: string } = {}) {
  window.dispatchEvent(new CustomEvent("mpj:chat", { detail }));
}
