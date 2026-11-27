import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <div className="article">
      <Crumbs items={[["/", "Home"], ["/privacy", "Privacy"]]} />
      <h1>Privacy</h1>
      <p className="notice"><b>Draft</b> · To be completed with counsel (GDPR, UK GDPR, Swiss FADP) before launch.</p>
      <p>We collect only what is needed to arrange your flights: your name, email and verified mobile number; the trips you book; the profile details you choose to add; and, for each flight, passenger names and passport details required by the operator and border authorities.</p>
      <p>Passport details are shared only with the operator and authorities for that flight and are deleted after landing unless you ask us to keep them on file. We never sell personal data. Analytics, where used, are cookie-free and never include personal data.</p>
      <p>To access, correct or delete your data, write to your Dedicated Advisor in the app.</p>
    </div>
  );
}
