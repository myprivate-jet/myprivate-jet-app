import type { Metadata } from "next";
export const metadata: Metadata = { title: "Advisor desk", robots: { index: false, follow: false } };
export default function AdvisorRoot({ children }: { children: React.ReactNode }) {
  return children;
}
