import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findWhitepaperById } from "@/lib/db";
import { getRequestSite } from "@/lib/request-site";
import { canDownloadPaper, recordPaperDownload } from "@/lib/reader-leads";
import { readDownloadPdf } from "@/lib/media";
import { isSiteDownloadReady } from "@/lib/site-readiness";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const site = await getRequestSite(); const { id } = await context.params; const lead = z.coerce.number().int().positive().safeParse(request.nextUrl.searchParams.get("lead"));
  const paper = await findWhitepaperById(Number(id));
  if (!site || !isSiteDownloadReady(site) || !paper || paper.siteId !== site.id || paper.status !== "published" || !lead.success || !(await canDownloadPaper(lead.data, site.id, paper.id))) return new NextResponse("Not found", { status: 404 });
  if (paper.downloadablePdfAsset && await readDownloadPdf(paper.downloadablePdfAsset)) {
    await recordPaperDownload(lead.data, site.id, paper.id);
    const bytes = await readDownloadPdf(paper.downloadablePdfAsset);
    return new NextResponse(bytes as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${paper.slug}.pdf"`, "Cache-Control": "private, no-store" } });
  }
  return new NextResponse("Download unavailable", { status: 404 });
}
