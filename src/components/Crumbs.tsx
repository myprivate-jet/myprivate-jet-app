import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { SITE } from "@/lib/site";

export function Crumbs({ items }: { items: [string, string][] }) {
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">{items.map(([href, label], i) => <span key={href}>{i > 0 && " / "}{i < items.length - 1 ? <Link href={href}>{label}</Link> : label}</span>)}</nav>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([href, name], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE.url + href })) }} />
    </>
  );
}
