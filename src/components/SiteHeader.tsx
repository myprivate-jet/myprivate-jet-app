import Link from "next/link";
import { getDict } from "@/i18n/server";
import { NavLinks } from "./NavLinks";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function SiteHeader({ member: _member }: { member: boolean }) {
  const { t, locale } = await getDict();
  // One destination in the header. Standards and guides live in the footer, where search engines still find them.
  const links = [{ href: "/office", label: t.nav.office }];
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
