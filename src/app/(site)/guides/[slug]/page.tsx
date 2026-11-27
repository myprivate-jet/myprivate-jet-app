import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLES, articleBySlug } from "@/content/articles";
import { AIRPORT_NOTES, EVENTS } from "@/lib/pricing/knowledge";
import { airport } from "@/lib/pricing/airports";
import { Crumbs } from "@/components/Crumbs";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { SITE } from "@/lib/site";

export const generateStaticParams = () => [...ARTICLES.map((a) => ({ slug: a.slug })), ...Object.keys(AIRPORT_NOTES).map((c) => ({ slug: `airport-${c.toLowerCase()}` }))];

function load(slug: string) {
  const a = articleBySlug(slug);
  if (a) return a;
  const m = slug.match(/^airport-([a-z0-9]{4})$/);
  const code = m?.[1].toUpperCase();
  const ap = code ? airport(code) : undefined;
  if (!code || !ap || !AIRPORT_NOTES[code]) return null;
  const ev = EVENTS.filter((e) => e.airports?.includes(code)).map((e) => e.name.replace(/^the /, ""));
  return {
    slug, kicker: "Airport", updated: "2026-11-27",
    title: `Flying privately to ${ap[3]}: ${ap[2]} (${code})`,
    description: AIRPORT_NOTES[code].split(". ").slice(0, 2).join(". ") + ".",
    body: [{ p: [AIRPORT_NOTES[code]] }, ...(ev.length ? [{ h: "Busy periods", p: [`${ev.join(", ")}. Aircraft and parking are scarce in these weeks, so confirm about six weeks ahead.`] }] : [])],
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = load((await params).slug);
  if (!a) return {};
  return { title: a.title, description: a.description, alternates: { canonical: `/guides/${a.slug}` }, openGraph: { type: "article", title: a.title, description: a.description } };
}

export default async function Guide({ params }: { params: Promise<{ slug: string }> }) {
  const a = load((await params).slug);
  if (!a) notFound();
  return (
    <div className="article">
      <Crumbs items={[["/", "Home"], ["/guides", "Guides"], [`/guides/${a.slug}`, a.kicker]]} />
      <div className="eyebrow" style={{ marginTop: 24 }}>{a.kicker}</div>
      <h1>{a.title}</h1>
      <p className="lede">{a.description}</p>
      {a.body.map((s, i) => <section key={i}>{s.h && <h2>{s.h}</h2>}{s.p.map((p, j) => <p key={j}>{p}</p>)}</section>)}
      <p className="fine">Updated {a.updated}. Checked public facts, reviewed by MyPrivate-Jet operations.</p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.description, dateModified: a.updated, author: { "@id": `${SITE.url}/#org` }, publisher: { "@id": `${SITE.url}/#org` }, mainEntityOfPage: `${SITE.url}/guides/${a.slug}` }} />
      <CtaBand />
    </div>
  );
}
