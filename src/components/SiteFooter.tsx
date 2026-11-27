import Link from "next/link";
import { getDict } from "@/i18n/server";

export async function SiteFooter() {
  const { t } = await getDict();
  const f = t.footerLinks;
  return (
    <footer>
      <div className="footer-links">
        <Link href="/assured-price">{f.how}</Link>
        <Link href="/standards">{f.standards}</Link>
        <Link href="/guides">{f.guides}</Link>
        <Link href="/faq">{f.faq}</Link>
        <Link href="/membership-terms">{f.terms}</Link>
        <Link href="/privacy">{f.privacy}</Link>
      </div>
      <p style={{ margin: 0 }}>{t.footer}</p>
      <p style={{ margin: "8px 0 0" }}>© {new Date().getFullYear()} MyPrivate-Jet. Cabin facts are typical of each standard and confirmed per aircraft. Promises shown (replacement aircraft, 2-hour confirmation) await final approval.</p>
    </footer>
  );
}
