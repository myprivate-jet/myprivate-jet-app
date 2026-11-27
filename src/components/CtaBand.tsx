import Link from "next/link";
export function CtaBand({ text = "One recommendation. One final price.", href = "/", label = "Plan a flight" }: { text?: string; href?: string; label?: string }) {
  return <div className="cta-band"><p>{text}</p><Link className="btn" href={href}>{label}</Link></div>;
}
