import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { ORDER, STANDARDS } from "@/lib/pricing/standards";
import { ROUTES } from "@/content/routes";
import { ARTICLES } from "@/content/articles";
import { AIRPORT_NOTES } from "@/lib/pricing/knowledge";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string, priority = 0.7): MetadataRoute.Sitemap[number] => ({ url: SITE.url + p, lastModified: new Date(), changeFrequency: "weekly", priority });
  return [
    u("/", 1), u("/assured-price", 0.9), u("/membership", 0.9), u("/standards", 0.8), u("/guides", 0.8), u("/faq", 0.7), u("/demo", 0.5),
    ...ORDER.map((s) => u(`/standards/${STANDARDS[s].slug}`)),
    ...ROUTES.map((r) => u(`/routes/${r.slug}`, 0.8)),
    ...ARTICLES.map((a) => u(`/guides/${a.slug}`)),
    ...Object.keys(AIRPORT_NOTES).map((c) => u(`/guides/airport-${c.toLowerCase()}`, 0.6)),
  ];
}
