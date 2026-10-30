import "server-only";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FeatureUnavailableError } from "@/lib/admin-http";

/**
 * Extract text and metadata from first page of PDF.
 * Used to determine if first page is a title page or content page.
 * Note: Full image rendering requires canvas library - for production,
 * consider using: Puppeteer, pdf2pic, or Cloudflare's wrangler-pdf library.
 */

const MAX_PDF_PAGES = 200;
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const PDF_TIMEOUT_MS = 30_000;

GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
).href;

export interface PDFPageInfo {
  pageNumber: number;
  text: string;
  width: number;
  height: number;
  hasImages: boolean;
  hasText: boolean;
}

/**
 * Extract information from a specific PDF page.
 * Returns text content, dimensions, and metadata.
 */
export async function extractPdfPageInfo(
  bytes: Buffer,
  pageNumber: number = 1,
): Promise<PDFPageInfo> {
  if (bytes.length < 5 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new FeatureUnavailableError("Uploaded file does not have a valid PDF signature.");
  }
  if (bytes.length > MAX_PDF_BYTES) {
    throw new FeatureUnavailableError("PDF must be no larger than 20 MB.");
  }

  const task = getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    useSystemFonts: true,
    useWorkerFetch: false,
    useWasm: false,
    stopAtErrors: true,
    isImageDecoderSupported: false,
  });

  let timedOut = false;
  let timeoutHandle: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      void task.destroy().then(
        () => reject(new FeatureUnavailableError("PDF analysis exceeded the 30-second limit.")),
        reject,
      );
    }, PDF_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      (async () => {
        const pdf = await task.promise;

        if (pdf.numPages < 1) {
          throw new FeatureUnavailableError("The PDF has no readable pages.");
        }

        if (pageNumber < 1 || pageNumber > pdf.numPages) {
          throw new FeatureUnavailableError(
            `Page ${pageNumber} does not exist. PDF has ${pdf.numPages} pages.`,
          );
        }

        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const textContent = await page.getTextContent();

        // Extract text
        const text = textContent.items
          .filter((item) => "str" in item && typeof (item as any).str === "string")
          .map((item) => (item as any).str)
          .join(" ");

        // Check for images
        const hasImages = textContent.items.some(
          (item) => "kind" in item && (item as any).kind === 1, // kind=1 is image
        );

        page.cleanup();

        return {
          pageNumber,
          text: text.trim(),
          width: Math.round(viewport.width),
          height: Math.round(viewport.height),
          hasImages,
          hasText: text.trim().length > 0,
        };
      })(),
      timeout,
    ]);
  } finally {
    clearTimeout(timeoutHandle!);
    if (!timedOut) await task.destroy();
  }
}

/**
 * Detect if a page is likely a title/cover page (has minimal content).
 * Useful to choose which page to use as cover.
 */
export async function isPageTitlePage(
  bytes: Buffer,
  pageNumber: number = 1,
): Promise<boolean> {
  try {
    const info = await extractPdfPageInfo(bytes, pageNumber);
    // If page has very little text (<200 chars) AND has images, it's likely a title page
    // If page has no text at all, it's blank
    return info.text.length < 200 || !info.hasText;
  } catch {
    return false;
  }
}

/**
 * Find best page to use as cover (skip blank/title pages).
 * Returns the first page number with substantive content.
 */
export async function findBestCoverPage(
  bytes: Buffer,
  maxPagesToCheck: number = 5,
): Promise<number> {
  try {
    const pageCount = await getPdfPageCount(bytes);
    const checkLimit = Math.min(maxPagesToCheck, pageCount);

    for (let pageNum = 1; pageNum <= checkLimit; pageNum++) {
      const isTitlePage = await isPageTitlePage(bytes, pageNum);
      if (!isTitlePage) {
        return pageNum; // Found a content page
      }
    }

    // If all checked pages are title pages, use first page
    return 1;
  } catch {
    // If something fails, default to first page
    return 1;
  }
}

/**
 * Get PDF page count and dimensions.
 */
export async function getPdfPageCount(bytes: Buffer): Promise<number> {
  if (bytes.length < 5 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new FeatureUnavailableError("Uploaded file does not have a valid PDF signature.");
  }
  if (bytes.length > MAX_PDF_BYTES) {
    throw new FeatureUnavailableError("PDF must be no larger than 20 MB.");
  }

  const task = getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    useSystemFonts: true,
    useWorkerFetch: false,
    useWasm: false,
    stopAtErrors: true,
    isImageDecoderSupported: false,
  });

  try {
    const pdf = await task.promise;
    return pdf.numPages;
  } finally {
    await task.destroy();
  }
}
