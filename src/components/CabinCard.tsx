import { STANDARDS, type StandardId } from "@/lib/pricing/standards";

/** Relative size of each cabin, for the drawn side view. */
const SIZE: Record<StandardId, number> = { reach: 0.5, signature: 0.64, distinction: 0.78, large: 0.89, privilege: 1 };
const LINE: Record<StandardId, string> = {
  reach: "Small airports and short hops.",
  signature: "The fastest way across Europe.",
  distinction: "Stand up, stretch out, a flat floor for longer days.",
  large: "Room for a family, and a cabin attendant.",
  privilege: "Separate rooms and a bed. Intercontinental nonstop.",
};
export const hm = (h: number) => { const m = Math.round((h * 60) / 5) * 5; return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };

/** We sell a category, never one model: always three typical examples. */
export const suchAs = (x: StandardId) => {
  const e = STANDARDS[x].examples.split(",").map((s) => s.trim());
  return `Such as ${e.slice(0, -1).join(", ")} or ${e[e.length - 1]}`;
};

/** A drawn side view of a business jet, scaled to the category. Not a specific aircraft. */
export function Jet({ x }: { x: StandardId }) {
  const n = SIZE[x], L = 120 + n * 160, x0 = (300 - L) / 2, cy = 52, r = 6.5 + n * 5, h = 13 + n * 13;
  const f = (a: number) => (x0 + L * a).toFixed(1);
  const k = 4 + Math.round(n * 7);
  return (
    <svg className="jet" viewBox="0 0 300 92" aria-hidden="true">
      <path d={`M${f(0)} ${cy} C${f(0)} ${cy - r * 0.95} ${f(0.07)} ${cy - r} ${f(0.15)} ${cy - r} L${f(0.8)} ${cy - r} L${f(1)} ${cy - r * 0.55} L${f(1)} ${cy + r * 0.05} L${f(0.82)} ${cy + r} L${f(0.12)} ${cy + r} C${f(0.04)} ${cy + r} ${f(0)} ${cy + r * 0.55} ${f(0)} ${cy}Z`} />
      <path d={`M${f(0.82)} ${cy - r} L${f(0.92)} ${cy - r - h} L${f(0.99)} ${cy - r - h} L${f(1)} ${cy - r * 0.55}`} />
      <path d={`M${f(0.88)} ${cy - r - h} L${f(1.04)} ${cy - r - h}`} />
      <path d={`M${f(0.4)} ${cy + r * 0.55} L${f(0.6)} ${cy + r * 0.55} L${f(0.69)} ${cy + r + 7} L${f(0.6)} ${cy + r + 7}Z`} />
      <ellipse cx={f(0.75)} cy={(cy - r * 0.78).toFixed(1)} rx={(L * 0.075).toFixed(1)} ry={(r * 0.42 + 1).toFixed(1)} />
      <path d={`M${f(0.035)} ${cy - r * 0.45} L${f(0.085)} ${cy - r * 0.62}`} />
      <g className="win">{Array.from({ length: k }, (_, i) => <ellipse key={i} cx={(x0 + L * (0.2 + (0.46 * i) / (k - 1))).toFixed(1)} cy={(cy - r * 0.22).toFixed(1)} rx="1.9" ry="2.5" />)}</g>
    </svg>
  );
}

/** Seats, time in the air for this trip, cabin height. */
export function CabinFacts({ x, hrs }: { x: StandardId; hrs: number }) {
  const s = STANDARDS[x];
  return (
    <div className="kf">
      <div><b>{s.maxPax}</b><span>seats</span></div>
      <div><b>{hm(hrs)}</b><span>this flight</span></div>
      <div><b>{s.height.replace(" to ", "–")}</b><span>{s.standUp ? "stand-up cabin" : "seated cabin"}</span></div>
    </div>
  );
}

export function CabinVisual({ x, recommended }: { x: StandardId; recommended?: boolean }) {
  return <div className="cv"><Jet x={x} />{recommended && <span className="badge">Recommended</span>}</div>;
}

/** A neighbouring category, as rich as the main card: one tap makes it the selection. */
export function CabinCard({ x, tag, price, hrs, recommended, onChoose }: { x: StandardId; tag: string; price: string; hrs: number; recommended: boolean; onChoose: () => void }) {
  return (
    <button type="button" className="cc" onClick={onChoose} aria-label={`${tag}: ${STANDARDS[x].name}, ${price}`}>
      <CabinVisual x={x} recommended={recommended} />
      <span className="cb">
        <span className="k">{tag}</span>
        <span className="nm">{STANDARDS[x].name}</span>
        <span className="ln">{LINE[x]}</span>
        <CabinFacts x={x} hrs={hrs} />
        <span className="ex">{suchAs(x)}.</span>
        <span className="pr"><span className="p">{price}</span><span className="ch">Choose</span></span>
      </span>
    </button>
  );
}
