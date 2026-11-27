import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ChatWidget } from "@/components/ChatWidget";
import { currentMember } from "@/server/auth/session";
import { getDict } from "@/i18n/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [member, { t }] = await Promise.all([currentMember(), getDict()]);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="wrap">
        <SiteHeader member={Boolean(member)} />
        <main id="main">{children}</main>
        <SiteFooter />
      </div>
      <ChatWidget member={Boolean(member)} label={t.chat} advisor={t.advisor} />
    </>
  );
}
