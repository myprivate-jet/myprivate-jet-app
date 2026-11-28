import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Public pages are open to search engines and AI assistants; private areas are not.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/office", "/advisor", "/api/"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
