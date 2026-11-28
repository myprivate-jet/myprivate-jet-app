import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Inter, Inter_Tight, Jost } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { getDict } from "@/i18n/server";
import { RTL } from "@/i18n/dictionaries";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";

const display = Inter_Tight({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const lux = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-lux", display: "swap" });
const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-jost", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "MyPrivate-Jet · Private jet charter with one Assured Price", template: "%s · MyPrivate-Jet" },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE.name, url: SITE.url, locale: "en_GB" },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f2ede2" }, { media: "(prefers-color-scheme: dark)", color: "#0b2219" }],
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getDict();
  return (
    <html lang={locale} dir={RTL.includes(locale) ? "rtl" : "ltr"} className={`${display.variable} ${lux.variable} ${jost.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE.url}/#org`,
            name: SITE.name,
            url: SITE.url,
            logo: `${SITE.url}/icon.svg`,
            email: SITE.email,
            description: SITE.description,
            areaServed: SITE.areaServed,
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
