"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  const active = (h: string) => (h === "/" ? path === "/" : path === h || (path.startsWith(h + "/") && !links.some((l) => l.href !== h && l.href.startsWith(h) && path.startsWith(l.href))));
  return (
    <nav className="nav" aria-label="Sections">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}>{l.label}</Link>
      ))}
    </nav>
  );
}
