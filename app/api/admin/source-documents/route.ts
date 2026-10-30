import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse, RequestValidationError } from "@/lib/admin-http";
import { createSourceDocument, deleteSourceDocument, listSites, sourceDocumentInputSchema, sourceScheduleBatchSchema } from "@/lib/db";
import { removeSourcePdf, saveSourcePdf } from "@/lib/media";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";

const MAX_BATCH_ITEMS = 20;
const MAX_BATCH_BYTES = 100 * 1024 * 1024;

function parseSourceInput(value: unknown): ReturnType<typeof sourceDocumentInputSchema.parse> {
  const result = sourceDocumentInputSchema.safeParse(value);
  if (!result.success) {
    throw new RequestValidationError(result.error.issues.map((issue) => issue.message).join(" "));
  }
  return result.data;
}

function titleFromUrl(value: string): string {
  if (!URL.canParse(value)) throw new RequestValidationError("Each external PDF link must be a valid HTTP(S) URL.");
  const url = new URL(value);
  const filename = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
  return filename.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim() || url.hostname;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const userSession = await getUserFromSession();
  if (!userSession) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BATCH_BYTES) {
    return NextResponse.json({ error: "The source batch exceeds the 100 MB total upload limit." }, { status: 413 });
  }

  const form = await request.formData();
  const fileEntries = form.getAll("sourcePdfs");
  if (fileEntries.some((entry) => typeof entry === "string" && entry.length > 0)) {
    return NextResponse.json({ error: "Invalid PDF upload field." }, { status: 400 });
  }
  const files = fileEntries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const urlLines = String(form.get("sourceUrls") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (files.length + urlLines.length < 1 || files.length + urlLines.length > MAX_BATCH_ITEMS) {
    return NextResponse.json({ error: `Choose between 1 and ${MAX_BATCH_ITEMS} PDFs or PDF links per batch.` }, { status: 400 });
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_BATCH_BYTES) {
    return NextResponse.json({ error: "The source batch exceeds the 100 MB total upload limit." }, { status: 413 });
  }

  const rawSchedules = form.getAll("sourceSchedules");
  const localDates = form.getAll("sourceScheduleDays");
  if (
    rawSchedules.some((entry) => typeof entry !== "string") ||
    localDates.some((entry) => typeof entry !== "string") ||
    rawSchedules.length !== files.length + urlLines.length ||
    localDates.length !== files.length + urlLines.length
  ) {
    return NextResponse.json({ error: "Choose a separate schedule date and time for every PDF and link." }, { status: 400 });
  }
  const schedulesResult = sourceScheduleBatchSchema.safeParse(rawSchedules.map((scheduledAt, index) => ({
    scheduledAt: String(scheduledAt),
    localDate: String(localDates[index]),
  })));
  if (!schedulesResult.success) {
    const message = schedulesResult.error.issues.map((issue) => issue.message).join(" ");
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const siteSlugs = form.getAll("targetSiteSlugs").map(String);
  const rightsStatus = String(form.get("rightsStatus") ?? "unknown");
  const rightsEvidence = String(form.get("rightsEvidence") ?? "");
  const uploadedAssets: string[] = [];
  const createdIds: number[] = [];

  try {
    await connectDatabase();
    const user = await User.findOne({ numericId: userSession.userId });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const common = {
      rightsStatus,
      rightsEvidence,
      targetSiteSlugs: siteSlugs,
    };
    const allSites = await listSites();
    const siteNames = new Map(allSites.map((site) => [site.slug, site.id]));
    if (siteSlugs.some((slug) => !siteNames.has(slug))) {
      throw new RequestValidationError("Select only sites registered in this workspace.");
    }

    // Check user has access to all selected sites
    const siteIds = siteSlugs.map((slug) => siteNames.get(slug)!);
    const userSiteIds = new Set(user.domainRoles.map((dr: any) => dr.siteId));
    if (siteIds.some((id) => !userSiteIds.has(id))) {
      throw new RequestValidationError("You do not have access to all selected sites.");
    }
    for (const [index, file] of files.entries()) {
      const sourceAsset = await saveSourcePdf(file);
      uploadedAssets.push(sourceAsset);
      const parsed = parseSourceInput({
        ...common,
        scheduledAt: schedulesResult.data[index].scheduledAt,
        title: file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").slice(0, 240) || "Untitled PDF",
        originalFilename: file.name.slice(0, 240),
        sourceAsset,
      });
      const source = await createSourceDocument(parsed);
      createdIds.push(source.id);
    }
    for (const [index, sourceUrl] of urlLines.entries()) {
      const parsed = parseSourceInput({
        ...common,
        scheduledAt: schedulesResult.data[files.length + index].scheduledAt,
        title: titleFromUrl(sourceUrl).slice(0, 240) || "External PDF source",
        originalFilename: "",
        sourceUrl,
        sourceAsset: "",
      });
      const source = await createSourceDocument(parsed);
      createdIds.push(source.id);
    }
    return NextResponse.redirect(new URL("/admin/sources?added=" + createdIds.length, request.url), 303);
  } catch (error) {
    for (const id of createdIds) {
      try {
        await deleteSourceDocument(id);
      } catch (cleanupError) {
        console.error("Unable to clean up incomplete bulk source record.", cleanupError);
      }
    }

    for (const asset of uploadedAssets) {
      try {
        await removeSourcePdf(asset);
      } catch (cleanupError) {
        console.error("Unable to clean up incomplete bulk source upload.", cleanupError);
      }
    }
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
