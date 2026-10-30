import { listWhitepapers } from "@/lib/db";
import { paginateItems } from "@/lib/catalog-pagination";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRequestSite } from "@/lib/request-site";
import { DefaultHome } from "@/templates/default/home";
import { NewsmagHome } from "@/templates/newsmag/home";
import { MagazineHome } from "@/templates/magazine/home";
import { NewsynHome } from "@/templates/newsy/home";
import { HotNewsyHome } from "@/templates/hotnewsy/home";
import { HotMagazineHome } from "@/templates/hotmagazine/home";
import { ClassicMagazineHome } from "@/templates/classicmagazine/home";
import { GamerWorldHome } from "@/templates/gamerworld/home";
import { PennNewsHome } from "@/templates/pennnews/home";
import { LifestyleHome } from "@/templates/lifestyle/home";
import type { HomePageData } from "@/templates/registry";

type HomePageProps = {
  searchParams: Promise<{ q?: string; topic?: string; page?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSite();
  if (!site) notFound();
  return {
    title: site.name,
    description: site.description,
    ...(site.publicUrl ? { alternates: { canonical: new URL("/", site.publicUrl).toString() } } : {}),
    robots: { index: site.indexingEnabled, follow: site.indexingEnabled },
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const site = await getRequestSite();
  if (!site) notFound();
  const allPapers = await listWhitepapers({ siteId: site.id });
  const categories = ["All topics", ...new Set(allPapers.map((p) => p.category))];
  const query = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  const requestedTopic = typeof params.topic === "string" ? params.topic : "All topics";
  const topic = categories.includes(requestedTopic) ? requestedTopic : "All topics";
  const normalizedQuery = query.trim().toLowerCase();
  const results = allPapers.filter((paper) => {
    const matchesTopic = topic === "All topics" || paper.category === topic;
    const searchable = [
      paper.title, paper.subtitle, paper.summary, paper.category, paper.publisher,
      paper.industry, paper.geographicTarget, paper.tags.join(" "),
      paper.seoKeywords.join(" "), paper.geoSummary, paper.keyEntities.join(" "),
    ].join(" ").toLowerCase();
    return matchesTopic && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  const pagination = paginateItems(results, params.page);
  const featured = allPapers.filter((p) => p.featured || p.coverImageUrl);
  const featuredPapers = featured.length > 0 ? featured : allPapers.slice(0, 5);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": site.publicUrl ? `${site.publicUrl}/#organization` : undefined,
        name: site.legalName || site.name,
        description: site.description,
        ...(site.publicUrl ? { url: site.publicUrl } : {}),
        ...(site.logoUrl ? { logo: site.logoUrl } : {}),
      },
      {
        "@type": "WebSite",
        name: site.name,
        description: site.description,
        ...(site.publicUrl ? { url: site.publicUrl } : {}),
      },
    ],
  };

  const data: HomePageData = {
    site,
    papers: allPapers,
    featuredPapers,
    categories,
    query,
    topic,
    pagination,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      {site.templateId === "newsmag" ? <NewsmagHome {...data} /> : site.templateId === "magazine" ? <MagazineHome {...data} /> : site.templateId === "newsy" ? <NewsynHome {...data} /> : site.templateId === "hotnewsy" ? <HotNewsyHome {...data} /> : site.templateId === "hotmagazine" ? <HotMagazineHome {...data} /> : site.templateId === "classicmagazine" ? <ClassicMagazineHome {...data} /> : site.templateId === "gamerworld" ? <GamerWorldHome {...data} /> : site.templateId === "pennnews" ? <PennNewsHome {...data} /> : site.templateId === "lifestyle" ? <LifestyleHome {...data} /> : <DefaultHome {...data} />}
    </>
  );
}
