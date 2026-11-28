"use client";
import { useState } from "react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * Any departure date, one tap. A month at a time, set like a page: serif figures on hairlines,
 * past days and days beyond a year quietly disabled.
 */
export function DateCalendar({ value, min, onPick }: { value: string; min: string; onPick: (iso: string) => void }) {
  const start = new Date((value || min) + "T12:00");
  const [y, setY] = useState(start.getFullYear());
  const [m, setM] = useState(start.getMonth());
  const minD = new Date(min + "T12:00");
  const maxD = new Date(minD); maxD.setFullYear(maxD.getFullYear() + 1);
  const first = new Date(y, m, 1, 12);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const canPrev = y > minD.getFullYear() || (y === minD.getFullYear() && m > minD.getMonth());
  const canNext = y < maxD.getFullYear() || (y === maxD.getFullYear() && m < maxD.getMonth());
  const shift = (k: number) => { const d = new Date(y, m + k, 1); setY(d.getFullYear()); setM(d.getMonth()); };
  return (
    <div className="cal" role="group" aria-label="Choose a departure date">
      <div className="cal-h">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month">‹</button>
        <span>{MONTHS[m]} {y}</span>
        <button type="button" onClick={() => shift(1)} disabled={!canNext} aria-label="Next month">›</button>
      </div>
      <div className="cal-g">
        {DOW.map((d) => <span key={d} className="cal-dow">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={"x" + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1; const id = isoOf(y, m, d); const dt = new Date(y, m, d, 12);
          const off = dt < minD || dt > maxD;
          return <button key={id} type="button" disabled={off} className={id === value ? "on" : ""} aria-pressed={id === value} aria-label={dt.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} onClick={() => onPick(id)}>{d}</button>;
        })}
      </div>
    </div>
  );
}
