import { NextRequest, NextResponse } from "next/server";
import { requireAdminForDomain } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import { createWhitepaper } from "@/lib/db";
import { parsePaperForm } from "@/lib/paper-form";
import { removeCoverImage, removeSourcePdf, saveCoverImage, saveSourcePdf, saveDownloadPdf, removeDownloadPdf } from "@/lib/media";

export async function POST(request: NextRequest) {
  if (!(await isSameOriginPost(request))) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
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
  const downloadEntry = form.get("downloadPdf");
  const downloadPdf = downloadEntry instanceof File && downloadEntry.size > 0 ? downloadEntry : undefined;
  const input = parsePaperForm(form, upload ? "/pending-upload" : "", sourcePdf ? "/pending-document" : "", downloadPdf ? "/pending-download" : "");
  if (!input.success) {
    const message = input.error.issues.map((issue) => issue.message).join(" ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await requireAdminForDomain(input.data.siteId, "editor");

  let uploadedUrl = "";
  let uploadedSourceUrl = "";
  let uploadedDownloadUrl = "";
  try {
    if (upload) uploadedUrl = await saveCoverImage(upload);
    if (sourcePdf) uploadedSourceUrl = await saveSourcePdf(sourcePdf);
    if (downloadPdf) uploadedDownloadUrl = await saveDownloadPdf(downloadPdf);
    const paper = await createWhitepaper({
      ...input.data,
      coverImageUrl: uploadedUrl,
      sourceDocumentAsset: uploadedSourceUrl,
      downloadablePdfAsset: uploadedDownloadUrl,
    });
    return NextResponse.redirect(new URL(`/admin/content/${paper.id}?saved=1`, request.url), 303);
  } catch (error) {
    if (uploadedUrl) {
      try {
        await removeCoverImage(uploadedUrl);
      } catch (cleanupError) {
        console.error("Unable to remove failed content cover upload.", cleanupError);
      }
    }
    if (uploadedSourceUrl) {
      try {
        await removeSourcePdf(uploadedSourceUrl);
      } catch (cleanupError) {
        console.error("Unable to remove failed source PDF upload.", cleanupError);
      }
    }
    if (uploadedDownloadUrl) await removeDownloadPdf(uploadedDownloadUrl);
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
