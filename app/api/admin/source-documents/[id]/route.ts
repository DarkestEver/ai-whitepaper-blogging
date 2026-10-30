import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse, RequestValidationError } from "@/lib/admin-http";
import { findSourceDocumentById, sourceDocumentInputSchema, updateSourceDocument, listSites } from "@/lib/db";
import { removeSourcePdf } from "@/lib/media";
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

  try {
    await connectDatabase();
    const user = await User.findOne({ numericId: userSession.userId });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const existing = await findSourceDocumentById(id);
    if (!existing) return NextResponse.json({ error: "Source document not found." }, { status: 404 });
    const form = await request.formData();
    const targetSiteSlugs = form.getAll("targetSiteSlugs").map(String);

    // Check user has access to all selected sites
    const allSites = await listSites();
    const slugToId = new Map(allSites.map((site) => [site.slug, site.id]));
    const siteIds = targetSiteSlugs.map((slug) => slugToId.get(slug));
    if (siteIds.some((id) => !id)) {
      throw new RequestValidationError("Select only sites registered in this workspace.");
    }
    const userSiteIds = new Set(user.domainRoles.map((dr: any) => dr.siteId));
    if (siteIds.some((id) => !userSiteIds.has(id!))) {
      throw new RequestValidationError("You do not have access to all selected sites.");
    }

    const result = sourceDocumentInputSchema.safeParse({
      title: form.get("title"),
      originalFilename: form.get("originalFilename"),
      sourceUrl: form.get("sourceUrl"),
      sourceAsset: form.get("sourceAsset"),
      rightsStatus: form.get("rightsStatus"),
      rightsEvidence: form.get("rightsEvidence"),
      scheduledAt: form.get("scheduledAt"),
      targetSiteSlugs: targetSiteSlugs,
    });
    if (!result.success) {
      throw new RequestValidationError(result.error.issues.map((issue) => issue.message).join(" "));
    }
    const updated = await updateSourceDocument(id, result.data);
    if (existing.sourceAsset && existing.sourceAsset !== updated.sourceAsset) {
      try {
        await removeSourcePdf(existing.sourceAsset);
      } catch (error) {
        console.error("Source metadata was saved, but prior PDF cleanup failed.", error);
        return NextResponse.json(
          { error: "Source changes were saved, but the previous uploaded PDF could not be removed. Check server logs and clean up the orphaned file." },
          { status: 500 },
        );
      }
    }
    return NextResponse.redirect(new URL("/admin/sources?saved=" + id, request.url), 303);
  } catch (error) {
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
