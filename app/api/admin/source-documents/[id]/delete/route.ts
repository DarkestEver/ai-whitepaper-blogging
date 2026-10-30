import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import { deleteSourceDocument, findSourceDocumentById, listSites } from "@/lib/db";
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

    const source = await findSourceDocumentById(id);
    if (!source) {
      return NextResponse.json({ error: "Source document not found." }, { status: 404 });
    }

    // Check user has access to at least one target site
    const allSites = await listSites();
    const slugToId = new Map(allSites.map((site) => [site.slug, site.id]));
    const siteIds = source.targetSiteSlugs.map((slug) => slugToId.get(slug)).filter(Boolean) as number[];
    const userSiteIds = new Set(user.domainRoles.map((dr: any) => dr.siteId));
    if (!siteIds.some((id) => userSiteIds.has(id))) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    await deleteSourceDocument(id);
    if (source?.sourceAsset) {
      try {
        await removeSourcePdf(source.sourceAsset);
      } catch (error) {
        console.error("Source record was deleted, but uploaded PDF cleanup failed.", error);
        return NextResponse.json(
          { error: "The source record was deleted, but its uploaded PDF could not be removed. Check server logs and clean up the orphaned file." },
          { status: 500 },
        );
      }
    }
    return NextResponse.redirect(new URL("/admin/sources?deleted=1", request.url), 303);
  } catch (error) {
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
