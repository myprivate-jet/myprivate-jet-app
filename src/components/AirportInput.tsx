"use client";
import { useEffect, useRef, useState } from "react";

export type AirportHit = { icao: string; iata: string; name: string; city: string; country: string };

/** Airport picker inside the brief sentence. Search runs on the server. */
export function AirportInput({ id, label, value, display, onPick, placeholder, autoFocus, className }: { id: string; label: string; value: string | null; display: string; onPick: (a: AirportHit | null) => void; placeholder?: string; autoFocus?: boolean; className?: string }) {
  const [text, setText] = useState(display);
  const [hits, setHits] = useState<AirportHit[]>([]);
  const [idx, setIdx] = useState(-1);
  const [open, setOpen] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => setText(display), [display]);

  async function search(q: string) {
    ctl.current?.abort();
    if (q.trim().length < 2) { setHits([]); return; }
    const c = new AbortController();
    ctl.current = c;
    try {
      const r = await fetch(`/api/airports?q=${encodeURIComponent(q)}`, { signal: c.signal });
      setHits(await r.json());
      setOpen(true);
      setIdx(-1);
    } catch { /* aborted */ }
  }

  const pick = (a: AirportHit) => { setText(a.city || a.name); setHits([]); setOpen(false); onPick(a); };

  return (
    <span className={`slot ${className ?? ""}`}>
      <input
        id={id}
        aria-label={label}
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls={`${id}-ac`}
        aria-autocomplete="list"
        value={text}
        placeholder={placeholder}
        autoFocus={autoFocus}
        enterKeyHint="next"
        spellCheck={false}
        title={value ?? undefined}
        onChange={(e) => { setText(e.target.value); if (value) onPick(null); search(e.target.value); }}
        onKeyDown={(e) => {
          if (!open || !hits.length) return;
          if (e.key === "ArrowDown") { setIdx((i) => Math.min(i + 1, hits.length - 1)); e.preventDefault(); }
          else if (e.key === "ArrowUp") { setIdx((i) => Math.max(i - 1, 0)); e.preventDefault(); }
          else if (e.key === "Enter") { pick(hits[Math.max(idx, 0)]); e.preventDefault(); }
          else if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && hits.length > 0 && (
        <span className="ac" id={`${id}-ac`} role="listbox">
          {hits.map((a, i) => (
            <button key={a.icao} type="button" role="option" aria-selected={i === idx} className={i === idx ? "on" : ""} onMouseDown={(e) => { e.preventDefault(); pick(a); }}>
              {a.city || a.name} <small>{a.name} · {a.icao}{a.iata ? " / " + a.iata : ""}</small>
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
