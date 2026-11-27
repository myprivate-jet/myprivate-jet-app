import type { Metadata } from "next";
import { currentMember } from "@/server/auth/session";
import { memberProfile } from "@/server/queries";
import { ProfileForm } from "@/components/office/ProfileForm";
import { JoinGate } from "@/components/office/JoinGate";

export const metadata: Metadata = { title: "Your profile", robots: { index: false, follow: false } };

export default async function Profile() {
  const m = await currentMember();
  if (!m) return <JoinGate />;
  const p = await memberProfile(m.id);
  return <ProfileForm initial={{ ...p, phone: `••• ${m.phone.slice(-3)}` }} />;
}
