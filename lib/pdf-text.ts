import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FeatureUnavailableError, RequestValidationError } from "@/lib/admin-http";

const MAX_PDF_PAGES = 200;
const MAX_SOURCE_TEXT_CHARS = 110_000;
const MAX_SOURCE_PDF_BYTES = 20 * 1024 * 1024;
const PDF_PROCESSING_TIMEOUT_MS = 30_000;
const MAX_AI_PAGES = 7;
const MAX_AI_TEXT_CHARS = 30_000;

GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
).href;

export async function extractPdfFirstPages(bytes: Buffer, maxPages: number = MAX_AI_PAGES): Promise<{ text: string; totalPageCount: number; extractedPageCount: number }> {
  if (bytes.length < 5 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new RequestValidationError("Uploaded source does not have a valid PDF signature.");
  }
  if (bytes.length > MAX_SOURCE_PDF_BYTES) {
    throw new RequestValidationError("Source PDF must be no larger than 20 MB.");
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
        () => reject(new FeatureUnavailableError("PDF extraction exceeded the 30-second local processing limit.")),
        reject,
      );
    }, PDF_PROCESSING_TIMEOUT_MS);
  });
  try {
    return await Promise.race([
      (async () => {
        const pdf = await task.promise;
        if (pdf.numPages < 1) throw new RequestValidationError("The PDF has no readable pages.");
        const pages: string[] = [];
        let charCount = 0;
        const pagesToExtract = Math.min(maxPages, pdf.numPages);
        for (let pageNumber = 1; pageNumber <= pagesToExtract && charCount < MAX_AI_TEXT_CHARS; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const pageSeparator = pages.length ? "\n" : "";
          const pagePrefix = `\n[Page ${pageNumber}]\n`;
          const pageLimit = MAX_AI_TEXT_CHARS - charCount - pageSeparator.length - pagePrefix.length;
          if (pageLimit <= 0) {
            page.cleanup();
            break;
          }
          let pageText = "";
          let truncated = false;
          try {
            const reader = page.streamTextContent().getReader();
            try {
              while (pageText.length < pageLimit) {
                const chunk = await reader.read();
                if (chunk.done) break;
                for (const item of chunk.value.items) {
                  if (!("str" in item) || !item.str) continue;
                  const separator = pageText ? " " : "";
                  const remaining = pageLimit - pageText.length - separator.length;
                  if (remaining <= 0) {
                    truncated = true;
                    break;
                  }
                  const boundedText = item.str.slice(0, remaining + 1).replace(/\s+/g, " ").trim();
                  const text = boundedText.slice(0, remaining);
                  if (text) pageText += `${separator}${text}`;
                  if (item.str.length > remaining || boundedText.length > remaining) {
                    truncated = true;
                    break;
                  }
                }
                if (truncated) break;
              }
              if (pageText.length >= pageLimit) truncated = true;
            } finally {
              if (truncated) await reader.cancel();
              reader.releaseLock();
            }
          } finally {
            page.cleanup();
          }
          if (pageText) {
            const block = `${pagePrefix}${pageText}`;
            pages.push(block);
            charCount += pageSeparator.length + block.length;
          }
          if (truncated) break;
        }
        const extracted = pages.join("\n").slice(0, MAX_AI_TEXT_CHARS);
        if (extracted.replace(/\[Page \d+\]/g, "").trim().length < 200) {
          throw new FeatureUnavailableError("No usable text was extracted. Scanned PDFs require OCR, which is not configured in this prototype.");
        }
        return { text: extracted, totalPageCount: pdf.numPages, extractedPageCount: pages.length };
      })(),
      timeout,
    ]);
  } finally {
    clearTimeout(timeoutHandle!);
    if (!timedOut) await task.destroy();
  }
}

export async function extractPdfText(bytes: Buffer): Promise<{ text: string; pageCount: number }> {
  if (bytes.length < 5 || bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new RequestValidationError("Uploaded source does not have a valid PDF signature.");
  }
  if (bytes.length > MAX_SOURCE_PDF_BYTES) {
    throw new RequestValidationError("Source PDF must be no larger than 20 MB.");
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
        () => reject(new FeatureUnavailableError("PDF extraction exceeded the 30-second local processing limit.")),
        reject,
      );
    }, PDF_PROCESSING_TIMEOUT_MS);
  });
  try {
    return await Promise.race([
      (async () => {
        const pdf = await task.promise;
        if (pdf.numPages < 1) throw new RequestValidationError("The PDF has no readable pages.");
        if (pdf.numPages > MAX_PDF_PAGES) {
          throw new FeatureUnavailableError(`This local prototype extracts at most ${MAX_PDF_PAGES} pages per PDF. Split the source into smaller parts.`);
        }
        const pages: string[] = [];
        let charCount = 0;
        for (let pageNumber = 1; pageNumber <= pdf.numPages && charCount < MAX_SOURCE_TEXT_CHARS; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const pageSeparator = pages.length ? "\n" : "";
          const pagePrefix = `\n[Page ${pageNumber}]\n`;
          const pageLimit = MAX_SOURCE_TEXT_CHARS - charCount - pageSeparator.length - pagePrefix.length;
          if (pageLimit <= 0) {
            page.cleanup();
            break;
          }
          let pageText = "";
          let truncated = false;
          try {
            const reader = page.streamTextContent().getReader();
            try {
              while (pageText.length < pageLimit) {
                const chunk = await reader.read();
                if (chunk.done) break;
                for (const item of chunk.value.items) {
                  if (!("str" in item) || !item.str) continue;
                  const separator = pageText ? " " : "";
                  const remaining = pageLimit - pageText.length - separator.length;
                  if (remaining <= 0) {
                    truncated = true;
                    break;
                  }
                  const boundedText = item.str.slice(0, remaining + 1).replace(/\s+/g, " ").trim();
                  const text = boundedText.slice(0, remaining);
                  if (text) pageText += `${separator}${text}`;
                  if (item.str.length > remaining || boundedText.length > remaining) {
                    truncated = true;
                    break;
                  }
                }
                if (truncated) break;
              }
              if (pageText.length >= pageLimit) truncated = true;
            } finally {
              if (truncated) await reader.cancel();
              reader.releaseLock();
            }
          } finally {
            page.cleanup();
          }
          if (pageText) {
            const block = `${pagePrefix}${pageText}`;
            pages.push(block);
            charCount += pageSeparator.length + block.length;
          }
          if (truncated) break;
        }
        const extracted = pages.join("\n").slice(0, MAX_SOURCE_TEXT_CHARS);
        if (extracted.replace(/\[Page \d+\]/g, "").trim().length < 200) {
          throw new FeatureUnavailableError("No usable text was extracted. Scanned PDFs require OCR, which is not configured in this prototype.");
        }
        return { text: extracted, pageCount: pdf.numPages };
      })(),
      timeout,
    ]);
  } finally {
    clearTimeout(timeoutHandle!);
    if (!timedOut) await task.destroy();
  }
}
