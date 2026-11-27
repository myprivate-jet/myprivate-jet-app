export const money = (v: number, c: string) =>
  new Intl.NumberFormat(c === "USD" ? "en-US" : "en-GB", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(v);

export const longDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
export const shortDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
export const addDays = (d: string, n: number) => {
  const x = new Date(d + "T12:00:00");
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};
export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Render **bold** markers from engine text as React-safe segments. */
export function boldSegments(s: string): { t: string; b: boolean }[] {
  return s.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p) => (p.startsWith("**") ? { t: p.slice(2, -2), b: true } : { t: p, b: false }));
}
