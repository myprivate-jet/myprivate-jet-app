import type { Metadata } from "next";
import { FAQ } from "@/content/articles";
import { Crumbs } from "@/components/Crumbs";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = { title: "Questions", description: "How MyPrivate-Jet works: the Assured Price, membership, payment, operators and your Dedicated Advisor.", alternates: { canonical: "/faq" } };

export default function Faq() {
  return (
    <div className="article faq">
      <Crumbs items={[["/", "Home"], ["/faq", "Questions"]]} />
      <h1>Questions, answered once</h1>
      {FAQ.map(([q, a]) => <details key={q} open><summary>{q}</summary><p>{a}</p></details>)}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      <CtaBand />
    </div>
  );
}
