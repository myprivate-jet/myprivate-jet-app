import { PlanFlight } from "@/components/PlanFlight";
import { currentMember } from "@/server/auth/session";
import { getDict } from "@/i18n/server";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export default async function Home() {
  const [member, { t }] = await Promise.all([currentMember(), getDict()]);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Private jet charter with an Assured Price",
          serviceType: "Private jet charter",
          provider: { "@id": `${SITE.url}/#org` },
          areaServed: SITE.areaServed,
          description: "One recommended cabin standard and one final, all-inclusive price. Free membership; a Dedicated Advisor arranges the flight with audited operators.",
        }}
      />
      <p className="hero-q">{t.heroQ}</p>
      <PlanFlight
        member={Boolean(member)}
        initial={{ from: "LSGG", to: "LFMN", fromLabel: "Geneva", toLabel: "Nice" }}
        guestNote={{ guest: t.guest, open: t.openOffice, demo: t.demo, promise: t.promise }}
      />
    </>
  );
}
