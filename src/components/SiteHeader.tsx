import Link from "next/link";
import { getDict } from "@/i18n/server";
import { NavLinks } from "./NavLinks";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function SiteHeader({ member }: { member: boolean }) {
  const { t, locale } = await getDict();
  const links = [
    { href: "/", label: t.nav.plan },
    { href: "/standards", label: t.nav.standards },
    { href: "/guides", label: t.nav.guides },
    { href: "/office", label: t.nav.office },
    ...(member ? [{ href: "/office/profile", label: t.nav.profile }] : []),
  ];
  return (
    <header className="top">
      <div className="brand">
        <Link href="/">MyPrivate<b>·</b>Jet</Link>
        <small>{t.tagline}</small>
      </div>
      <div className="hdr-r">
        <NavLinks links={links} />
        <LocaleSwitcher locale={locale} />
      </div>
    </header>
  );
}
