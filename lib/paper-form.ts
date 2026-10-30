import { paperInputSchema, type PaperInput, type PaperRecord } from "@/lib/db";

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function parsePaperForm(form: FormData, coverImageUrl: string, sourceDocumentAsset: string, downloadablePdfAsset = "") {
  const faqItems = lines(form.get("faqItems")).map((line) => {
    const separator = line.indexOf("|||");
    return separator < 0
      ? { question: line, answer: "" }
      : { question: line.slice(0, separator).trim(), answer: line.slice(separator + 3).trim() };
  });

  return paperInputSchema.safeParse({
    siteId: form.get("siteId"),
    title: form.get("title"),
    slug: form.get("slug"),
    summary: form.get("summary"),
    category: form.get("category"),
    publisher: form.get("publisher"),
    readingMinutes: form.get("readingMinutes"),
    status: form.get("status"),
    abstract: form.get("abstract"),
    takeaways: lines(form.get("takeaways")),
    subtitle: form.get("subtitle"),
    authorName: form.get("authorName"),
    authorTitle: form.get("authorTitle"),
    documentType: form.get("documentType"),
    language: form.get("language"),
    publicationDate: form.get("publicationDate"),
    industry: form.get("industry"),
    targetAudience: form.get("targetAudience"),
    geographicTarget: form.get("geographicTarget"),
    tags: lines(form.get("tags")),
    sourceName: form.get("sourceName"),
    sourceUrl: form.get("sourceUrl"),
    seoTitle: form.get("seoTitle"),
    seoDescription: form.get("seoDescription"),
    canonicalUrl: form.get("canonicalUrl"),
    seoKeywords: lines(form.get("seoKeywords")),
    geoSummary: form.get("geoSummary"),
    keyEntities: lines(form.get("keyEntities")),
    keyFacts: lines(form.get("keyFacts")),
    faqItems,
    coverImageUrl,
    coverImageAlt: form.get("coverImageAlt"),
    featured: form.get("featured") === "on",
    sourceDocumentUrl: form.get("sourceDocumentUrl"),
    sourceDocumentAsset,
    downloadablePdfAsset,
    sourceDocumentTitle: form.get("sourceDocumentTitle"),
    sourceRightsStatus: form.get("sourceRightsStatus"),
    sourceRightsEvidence: form.get("sourceRightsEvidence"),
    scheduledAt: form.get("scheduledAt"),
  });
}

export function paperFormData(paper: PaperRecord): PaperInput {
  return {
    siteId: paper.siteId,
    title: paper.title,
    slug: paper.slug,
    summary: paper.summary,
    category: paper.category,
    publisher: paper.publisher,
    readingMinutes: paper.readingMinutes,
    status: paper.status,
    abstract: paper.abstract,
    takeaways: paper.takeaways,
    subtitle: paper.subtitle,
    authorName: paper.authorName,
    authorTitle: paper.authorTitle,
    documentType: paper.documentType,
    language: paper.language,
    publicationDate: paper.publicationDate,
    industry: paper.industry,
    targetAudience: paper.targetAudience,
    geographicTarget: paper.geographicTarget,
    tags: paper.tags,
    sourceName: paper.sourceName,
    sourceUrl: paper.sourceUrl,
    sourceDocumentUrl: paper.sourceDocumentUrl,
    sourceDocumentAsset: paper.sourceDocumentAsset,
    downloadablePdfAsset: paper.downloadablePdfAsset,
    sourceDocumentTitle: paper.sourceDocumentTitle,
    sourceRightsStatus: paper.sourceRightsStatus,
    sourceRightsEvidence: paper.sourceRightsEvidence,
    scheduledAt: paper.scheduledAt,
    seoTitle: paper.seoTitle,
    seoDescription: paper.seoDescription,
    canonicalUrl: paper.canonicalUrl,
    seoKeywords: paper.seoKeywords,
    geoSummary: paper.geoSummary,
    keyEntities: paper.keyEntities,
    keyFacts: paper.keyFacts,
    faqItems: paper.faqItems,
    coverImageUrl: paper.coverImageUrl,
    coverImageAlt: paper.coverImageAlt,
    featured: paper.featured,
    htmlContent: paper.htmlContent || "",
  };
}
