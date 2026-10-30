import { getRequestSite } from "@/lib/request-site";
import { listWhitepapers } from "@/lib/db";
import { absoluteSiteUrl, siteBaseUrl } from "@/lib/site-public";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const site = await getRequestSite();
  if (!site || !site.indexingEnabled) return new Response("Feed unavailable", { status: 404 });
  const papers = (await listWhitepapers({ siteId: site.id })).filter((paper) => paper.status === "published");
  const items = papers.map((paper) => {
    const url = paper.canonicalUrl || absoluteSiteUrl(site, `/whitepapers/${encodeURIComponent(paper.slug)}`);
    return `<item><title>${escapeXml(paper.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><description>${escapeXml(paper.summary)}</description><pubDate>${new Date(paper.publicationDate || paper.updatedAt).toUTCString()}</pubDate></item>`;
  }).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(site.name)}</title><link>${escapeXml(siteBaseUrl(site))}</link><description>${escapeXml(site.description)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
