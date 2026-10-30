import type { MetadataRoute } from "next";
import { getRequestSite } from "@/lib/request-site";
import { listWhitepapers } from "@/lib/db";
import { absoluteSiteUrl } from "@/lib/site-public";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getRequestSite();
  if (!site || !site.indexingEnabled) return [];
  const papers = await listWhitepapers({ siteId: site.id });
  const staticPaths = ["/", "/contact", "/privacy", "/terms", "/cookies", "/disclaimer", "/editorial-policy", "/accessibility"];
  return [
    ...staticPaths.map((path) => ({ url: absoluteSiteUrl(site, path), lastModified: new Date(site.updatedAt) })),
    ...papers.filter((paper) => paper.status === "published").map((paper) => ({
      url: paper.canonicalUrl || absoluteSiteUrl(site, `/whitepapers/${encodeURIComponent(paper.slug)}`),
      lastModified: new Date(paper.updatedAt),
      changeFrequency: "monthly" as const,
      priority: paper.featured ? 0.9 : 0.7,
    })),
  ];
}
