import { getRequestSite } from "@/lib/request-site";
import { listWhitepapers } from "@/lib/db";
import { absoluteSiteUrl } from "@/lib/site-public";

export const dynamic = "force-dynamic";

export async function GET() {
  const site = await getRequestSite();
  if (!site || !site.indexingEnabled) return new Response("Not available", { status: 404 });
  const papers = (await listWhitepapers({ siteId: site.id })).filter((paper) => paper.status === "published");
  const lines = [`# ${site.name}`, `> ${site.description}`, "", "## Policies", `- Contact: ${site.contactEmail || "See /contact"}`, "- Content is editorial material; verify claims against the cited source.", "", "## Published content", ...papers.map((paper) => `- [${paper.title}](${paper.canonicalUrl || absoluteSiteUrl(site, `/whitepapers/${encodeURIComponent(paper.slug)}`)}): ${paper.summary}`)];
  return new Response(`${lines.join("\n")}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
