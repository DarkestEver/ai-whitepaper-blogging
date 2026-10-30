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
import { slugify } from "@/lib/slugify";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getRequestSite();
  if (!site) notFound();
  const allPapers = await listWhitepapers({ siteId: site.id });
  const category = allPapers.map((p) => p.category).find((c) => slugify(c) === slug);
  return {
    title: category ? `${category} - ${site.name}` : site.name,
    description: category ? `Browse ${category} articles on ${site.name}` : site.description,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const site = await getRequestSite();
  if (!site) notFound();
  const allPapers = await listWhitepapers({ siteId: site.id });
  const categories = ["All topics", ...new Set(allPapers.map((p) => p.category))];
  const category = categories.find((c) => slugify(c) === slug);
  if (!category || category === "All topics") notFound();

  const query = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const normalizedQuery = query.trim().toLowerCase();
  const results = allPapers.filter((paper) => {
    const matchesTopic = paper.category === category;
    const searchable = [
      paper.title, paper.subtitle, paper.summary, paper.category, paper.publisher,
      paper.industry, paper.geographicTarget, paper.tags.join(" "),
      paper.seoKeywords.join(" "), paper.geoSummary, paper.keyEntities.join(" "),
    ].join(" ").toLowerCase();
    return matchesTopic && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  const pagination = paginateItems(results, sp.page);
  const featured = allPapers.filter((p) => p.featured || p.coverImageUrl);
  const featuredPapers = featured.length > 0 ? featured : allPapers.slice(0, 5);

  const data: HomePageData = {
    site,
    papers: allPapers,
    featuredPapers,
    categories,
    query,
    topic: category,
    pagination,
  };

  return site.templateId === "newsmag" ? <NewsmagHome {...data} /> : site.templateId === "magazine" ? <MagazineHome {...data} /> : site.templateId === "newsy" ? <NewsynHome {...data} /> : site.templateId === "hotnewsy" ? <HotNewsyHome {...data} /> : site.templateId === "hotmagazine" ? <HotMagazineHome {...data} /> : site.templateId === "classicmagazine" ? <ClassicMagazineHome {...data} /> : site.templateId === "gamerworld" ? <GamerWorldHome {...data} /> : site.templateId === "pennnews" ? <PennNewsHome {...data} /> : site.templateId === "lifestyle" ? <LifestyleHome {...data} /> : <DefaultHome {...data} />;
}
