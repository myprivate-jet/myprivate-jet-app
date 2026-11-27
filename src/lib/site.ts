export const SITE = {
  name: "MyPrivate-Jet",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.myprivate-jet.com").replace(/\/$/, ""),
  description:
    "Premium private jet charter with one recommended cabin and one final, all-inclusive Assured Price. A Dedicated Advisor arranges every flight with audited operators.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "office@myprivate-jet.com",
  areaServed: ["Europe", "United States", "Middle East", "Caribbean"],
};
