import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import { generateDraftsForSource } from "@/lib/ai-drafts";
import {
  claimSourceDocumentGeneration,
  findSourceDocumentById,
  listSites,
  markSourceDocumentFailed,
  markSourceDocumentGenerated,
} from "@/lib/db";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSameOriginPost(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const userSession = await getUserFromSession();
  if (!userSession) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid source document identifier." }, { status: 400 });
  }

  await connectDatabase();
  const user = await User.findOne({ numericId: userSession.userId });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const source = await findSourceDocumentById(id);
  if (!source) return NextResponse.json({ error: "Source document not found." }, { status: 404 });

  // Check user has access to at least one target site
  const allSites = await listSites();
  const slugToId = new Map(allSites.map((site) => [site.slug, site.id]));
  const siteIds = source.targetSiteSlugs.map((slug) => slugToId.get(slug)).filter(Boolean) as number[];
  const userSiteIds = new Set(user.domainRoles.map((dr: any) => dr.siteId));
  if (!siteIds.some((id) => userSiteIds.has(id))) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }
  if (!source.sourceAsset) {
    return NextResponse.json({ error: "AI generation requires an uploaded PDF; external URLs are not fetched." }, { status: 400 });
  }
  if (source.status === "generated") {
    return NextResponse.json({ error: "Drafts have already been generated for this source. Edit the source to reset its generation state first." }, { status: 409 });
  }
  if (!(await claimSourceDocumentGeneration(id))) {
    return NextResponse.json({ error: "This source is already being processed. Refresh the library before retrying." }, { status: 409 });
  }

  try {
    const sites = (await listSites()).filter((site) => source.targetSiteSlugs.includes(site.slug));
    const drafts = await generateDraftsForSource(source, sites);
    await markSourceDocumentGenerated(id, drafts.map((draft) => draft.id));
    const coverCount = drafts.filter((draft) => draft.coverImageUrl).length;
    return NextResponse.redirect(new URL(`/admin/sources?generated=${id}&count=${drafts.length}&covers=${coverCount}`, request.url), 303);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "AI draft generation failed.";
    try {
      await markSourceDocumentFailed(id, errorMessage);
    } catch (statusError) {
      console.error("Unable to record source generation failure.", statusError);
    }
    const response = safeErrorResponse(error);
    const errorUrl = new URL("/admin/sources", request.url);
    errorUrl.searchParams.set("sourceError", response.message);
    errorUrl.searchParams.set("sourceId", String(id));
    return NextResponse.redirect(errorUrl, 303);
  }
}
