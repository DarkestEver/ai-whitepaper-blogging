import { NextRequest, NextResponse } from "next/server";
import { requireAdminForDomain } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import { deleteWhitepaper, findWhitepaperById, updateWhitepaper } from "@/lib/db";
import { parsePaperForm } from "@/lib/paper-form";
import { removeCoverImage, removeSourcePdf, saveCoverImage, saveSourcePdf, saveDownloadPdf, removeDownloadPdf } from "@/lib/media";

type RouteContext = { params: Promise<{ id: string }> };

function validId(value: string): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isSameOriginPost(request))) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const { id: rawId } = await context.params;
  const id = validId(rawId);
  if (id === null) return NextResponse.json({ error: "Invalid content identifier." }, { status: 400 });
  const existing = await findWhitepaperById(id);
  if (!existing) return NextResponse.json({ error: "Content was not found." }, { status: 404 });

  await requireAdminForDomain(existing.siteId, "editor");

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 26 * 1024 * 1024) {
    return NextResponse.json({ error: "Content request exceeds the 26 MB combined upload limit." }, { status: 413 });
  }
  const form = await request.formData();
  const uploadEntry = form.get("coverImage");
  if (typeof uploadEntry === "string" && uploadEntry) {
    return NextResponse.json({ error: "Invalid cover image upload." }, { status: 400 });
  }
  const upload = uploadEntry instanceof File && uploadEntry.size > 0 ? uploadEntry : undefined;
  const sourceEntry = form.get("sourcePdf");
  if (typeof sourceEntry === "string" && sourceEntry) {
    return NextResponse.json({ error: "Invalid source PDF upload." }, { status: 400 });
  }
  const sourcePdf = sourceEntry instanceof File && sourceEntry.size > 0 ? sourceEntry : undefined;
  const removeImage = form.get("removeCoverImage") === "on";
  const currentImageUrl = removeImage ? "" : existing.coverImageUrl;
  const removeSource = form.get("removeSourceDocument") === "on";
  const currentSourceUrl = removeSource ? "" : existing.sourceDocumentAsset;
  const currentDownloadUrl = form.get("removeDownloadPdf") === "on" ? "" : existing.downloadablePdfAsset;
  const downloadEntry = form.get("downloadPdf");
  const downloadPdf = downloadEntry instanceof File && downloadEntry.size > 0 ? downloadEntry : undefined;
  const input = parsePaperForm(form, upload ? "/pending-upload" : currentImageUrl, sourcePdf ? "/pending-document" : currentSourceUrl, downloadPdf ? "/pending-download" : currentDownloadUrl);
  if (!input.success) {
    return NextResponse.json({ error: input.error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
  }

  let uploadedUrl = "";
  let uploadedSourceUrl = "";
  let uploadedDownloadUrl = "";
  try {
    if (upload) uploadedUrl = await saveCoverImage(upload);
    if (sourcePdf) uploadedSourceUrl = await saveSourcePdf(sourcePdf);
    if (downloadPdf) uploadedDownloadUrl = await saveDownloadPdf(downloadPdf);
    const paper = await updateWhitepaper(id, {
      ...input.data,
      coverImageUrl: uploadedUrl || currentImageUrl,
      sourceDocumentAsset: uploadedSourceUrl || currentSourceUrl,
      downloadablePdfAsset: uploadedDownloadUrl || currentDownloadUrl,
    });
    if (existing.coverImageUrl && existing.coverImageUrl !== paper.coverImageUrl) {
      try {
        await removeCoverImage(existing.coverImageUrl);
      } catch (error) {
        console.error("Unable to remove replaced local cover image.", error);
      }
    }
    if (existing.sourceDocumentAsset && existing.sourceDocumentAsset !== paper.sourceDocumentAsset) {
      try {
        await removeSourcePdf(existing.sourceDocumentAsset);
      } catch (error) {
        console.error("Unable to remove replaced local source PDF.", error);
      }
    }
    if (existing.downloadablePdfAsset && existing.downloadablePdfAsset !== paper.downloadablePdfAsset) await removeDownloadPdf(existing.downloadablePdfAsset);
    return NextResponse.redirect(new URL(`/admin/content/${paper.id}?saved=1`, request.url), 303);
  } catch (error) {
    if (uploadedUrl) {
      try {
        await removeCoverImage(uploadedUrl);
      } catch (cleanupError) {
        console.error("Unable to remove failed replacement cover upload.", cleanupError);
      }
    }
    if (uploadedSourceUrl) {
      try {
        await removeSourcePdf(uploadedSourceUrl);
      } catch (cleanupError) {
        console.error("Unable to remove failed replacement source PDF.", cleanupError);
      }
    }
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isSameOriginPost(request))) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const { id: rawId } = await context.params;
  const id = validId(rawId);
  if (id === null) return NextResponse.json({ error: "Invalid content identifier." }, { status: 400 });
  try {
    const existing = await findWhitepaperById(id);
    if (!existing) return NextResponse.json({ error: "Content was not found." }, { status: 404 });
    await requireAdminForDomain(existing.siteId, "editor");
    await deleteWhitepaper(id);
    if (existing.coverImageUrl) {
      try {
        await removeCoverImage(existing.coverImageUrl);
      } catch (error) {
        console.error("Unable to remove deleted content cover image.", error);
      }
    }
    if (existing.sourceDocumentAsset) {
      try {
        await removeSourcePdf(existing.sourceDocumentAsset);
      } catch (error) {
        console.error("Unable to remove deleted source PDF.", error);
      }
    }
    if (existing.downloadablePdfAsset) await removeDownloadPdf(existing.downloadablePdfAsset);
    return NextResponse.redirect(new URL("/admin/content?deleted=1", request.url), 303);
  } catch (error) {
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
