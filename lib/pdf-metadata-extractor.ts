import "server-only";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Extracts metadata from PDF properties.
 * Supplements AI-generated content with document-level metadata.
 */
export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creationDate?: string;
  modificationDate?: string;
  producer?: string;
  creator?: string;
  pages: number;
}

export async function extractPdfMetadata(bytes: Buffer): Promise<PDFMetadata> {
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

    const metadata = await pdf.getMetadata();
    const infoArray = metadata?.info as (Record<string, unknown> | undefined)[] | undefined;
    const info = (infoArray && infoArray.length > 0 ? infoArray[0] : {}) as Record<string, unknown>;

    // Extract keywords from PDF metadata
    const keywordsStr = ((info.Keywords || info.keywords) ?? "") as string;
    const keywords = keywordsStr
      .split(/[,;]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && k.length < 60)
      .slice(0, 20);

    // Parse ISO date format (D:YYYYMMDDHHmmSS format or ISO 8601)
    const parseDate = (dateStr: unknown): string | undefined => {
      if (!dateStr || typeof dateStr !== "string") return undefined;
      try {
        // Handle PDF date format: D:20231025120000
        if (dateStr.startsWith("D:")) {
          const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})/);
          if (match) {
            return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toISOString();
          }
        }
        // Try ISO 8601
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) return date.toISOString();
      } catch {
        // Ignore parse errors
      }
      return undefined;
    };

    return {
      title: (info.Title || info.title) as string | undefined,
      author: (info.Author || info.author) as string | undefined,
      subject: (info.Subject || info.subject) as string | undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
      creationDate: parseDate(info.CreationDate || info.creationDate),
      modificationDate: parseDate(info.ModDate || info.modDate),
      producer: (info.Producer || info.producer) as string | undefined,
      creator: (info.Creator || info.creator) as string | undefined,
      pages: pdf.numPages,
    };
  } finally {
    await task.destroy();
  }
}
