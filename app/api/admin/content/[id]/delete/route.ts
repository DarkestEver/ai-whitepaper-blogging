import { NextRequest, NextResponse } from "next/server";
import { requireAdminForDomain } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import { deleteWhitepaper, findWhitepaperById } from "@/lib/db";
import { removeCoverImage, removeSourcePdf } from "@/lib/media";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isSameOriginPost(request))) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid content identifier." }, { status: 400 });
  try {
    const existing = await findWhitepaperById(id);
    if (!existing) return NextResponse.json({ error: "Content was not found." }, { status: 404 });
    await requireAdminForDomain(existing.siteId, "editor");
    await deleteWhitepaper(id);
    if (existing?.coverImageUrl) {
      try {
        await removeCoverImage(existing.coverImageUrl);
      } catch (error) {
        console.error("Unable to remove deleted content cover image.", error);
      }
    }
    if (existing?.sourceDocumentAsset) {
      try {
        await removeSourcePdf(existing.sourceDocumentAsset);
      } catch (error) {
        console.error("Unable to remove deleted source PDF.", error);
      }
    }
    return NextResponse.redirect(new URL("/admin/content?deleted=1", request.url), 303);
  } catch (error) {
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
