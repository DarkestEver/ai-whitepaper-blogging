import { randomUUID } from "node:crypto";
import { z } from "zod";
import { whitepapers as samplePapers, type Whitepaper } from "@/lib/catalog";
import { findThemePreset } from "@/lib/themes";
import { assertKillSwitchOff, RequestValidationError } from "@/lib/admin-http";
import { connectDatabase } from "@/lib/mongodb";
import {
  AuditEvent,
  Counter,
  EditorialReviewEvent,
  nextId,
  Site,
  SourceDocument,
  Whitepaper as WhitepaperModel,
} from "@/lib/models";

export type PaperRecord = Whitepaper & {
  id: number;
  siteId: number;
  status: "draft" | "scheduled" | "published" | "archived";
  editorialStatus: "draft" | "in_review" | "approved" | "changes_requested";
  updatedAt: string;
  subtitle: string;
  authorName: string;
  authorTitle: string;
  documentType: "whitepaper" | "research_report" | "case_study" | "guide" | "briefing";
  language: string;
  publicationDate: string;
  industry: string;
  targetAudience: string;
  geographicTarget: string;
  tags: string[];
  sourceName: string;
  sourceUrl: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  seoKeywords: string[];
  geoSummary: string;
  keyEntities: string[];
  keyFacts: string[];
  faqItems: Array<{ question: string; answer: string }>;
  coverImageUrl: string;
  coverImageAlt: string;
  featured: boolean;
  sourceDocumentUrl: string;
  sourceDocumentAsset: string;
  downloadablePdfAsset: string;
  sourceDocumentTitle: string;
  sourceRightsStatus: "unknown" | "allowed" | "review_required" | "blocked" | "expired";
  sourceRightsEvidence: string;
  scheduledAt: string;
  htmlContent?: string;
};

export const rightsStatusValues = ["unknown", "allowed", "review_required", "blocked", "expired"] as const;

export type SiteRecord = {
  id: number;
  name: string;
  slug: string;
  description: string;
  themeId: string;
  templateId: string;
  templateConfig: Record<string, string>;
  publicUrl: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  brandColor: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  legalName: string;
  privacyPolicy: string;
  termsOfUse: string;
  cookiePolicy: string;
  disclaimer: string;
  editorialPolicy: string;
  accessibilityStatement: string;
  indexingEnabled: boolean;
  socialLinks: Array<{ platform: string; url: string }>;
  emailEnabled: boolean;
  emailProvider: string;
  emailApiUrl: string;
  emailSecretRef: string;
  emailFromEmail: string;
  emailFromName: string;
  emailReplyTo: string;
  emailApproved: boolean;
  privacyApproved: boolean;
  termsApproved: boolean;
  downloadEnabled: boolean;
  leadRetentionDays: number;
  verificationTokenMinutes: number;
  downloadRateLimitPerHour: number;
  maxDownloadsPerLead: number;
  updatedAt: string;
};

export type SourceDocumentRecord = {
  id: number;
  title: string;
  originalFilename: string;
  sourceUrl: string;
  sourceAsset: string;
  rightsStatus: PaperRecord["sourceRightsStatus"];
  rightsEvidence: string;
  scheduledAt: string;
  targetSiteSlugs: string[];
  status: "ready" | "scheduled" | "processing" | "generated" | "failed";
  error: string;
  generatedPaperIds: number[];
  createdAt: string;
  updatedAt: string;
};

// --- Zod schemas (unchanged) ---

function isPrivateHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "[::1]") return true;
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 0) return true;
  }
  return false;
}

function isHttpUrlOrEmpty(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:")
      && !url.username
      && !url.password
      && !isPrivateHostname(url.hostname);
  } catch {
    return false;
  }
}

function isValidDateOnly(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isIsoTimestampOrEmpty(value: string): boolean {
  if (!value) return true;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

export const sourceDocumentInputSchema = z.object({
  title: z.string().trim().min(3).max(240),
  originalFilename: z.string().trim().max(240).default(""),
  sourceUrl: z.string().trim().max(2048).refine(isHttpUrlOrEmpty, "Source URL must use HTTP or HTTPS.").default(""),
  sourceAsset: z.string().trim().max(256).regex(/^(?:|\/api\/admin\/source-files\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf)$/).default(""),
  rightsStatus: z.enum(rightsStatusValues).default("unknown"),
  rightsEvidence: z.string().trim().max(2000).default(""),
  scheduledAt: z.string().trim().min(1, "Choose a schedule date and time for this source.").max(40)
    .refine(isIsoTimestampOrEmpty, "Schedule must include an explicit timezone.")
    .transform((value) => new Date(value).toISOString()),
  targetSiteSlugs: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
}).superRefine((value, context) => {
  if (!value.sourceUrl && !value.sourceAsset) {
    context.addIssue({ code: "custom", path: ["sourceAsset"], message: "Attach a PDF or enter an external PDF URL." });
  }
  if (value.sourceUrl && value.sourceAsset) {
    context.addIssue({ code: "custom", path: ["sourceUrl"], message: "Use either an uploaded PDF or an external URL, not both." });
  }
  if (Date.parse(value.scheduledAt) <= Date.now()) {
    context.addIssue({ code: "custom", path: ["scheduledAt"], message: "Schedule must be a future date and time." });
  }
});

export const sourceScheduleBatchSchema = z.array(z.object({
  scheduledAt: z.string().trim().min(1).max(40).refine(isIsoTimestampOrEmpty, "Schedule must include an explicit timezone."),
  localDate: z.string().trim().refine(isValidDateOnly, "Choose a valid schedule date."),
})).min(1).max(20).superRefine((schedules, context) => {
  const usedDates = new Set<string>();
  const usedUtcDates = new Set<string>();
  schedules.forEach((schedule, index) => {
    const parsedDate = Date.parse(schedule.scheduledAt);
    if (parsedDate <= Date.now()) {
      context.addIssue({ code: "custom", path: [index, "scheduledAt"], message: "Every source schedule must be in the future." });
    }
    if (usedDates.has(schedule.localDate)) {
      context.addIssue({ code: "custom", path: [index, "localDate"], message: "Every source must have a different schedule date." });
    }
    usedDates.add(schedule.localDate);
    if (!Number.isNaN(parsedDate)) {
      const utcDate = new Date(parsedDate).toISOString().slice(0, 10);
      if (usedUtcDates.has(utcDate)) {
        context.addIssue({ code: "custom", path: [index, "scheduledAt"], message: "Every source must have a different schedule date." });
      }
      usedUtcDates.add(utcDate);
    }
  });
});

export const paperInputSchema = z.object({
  siteId: z.coerce.number().int().positive().default(1),
  title: z.string().trim().min(3).max(140),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  summary: z.string().trim().min(15).max(500),
  category: z.string().trim().min(2).max(80),
  publisher: z.string().trim().min(2).max(120),
  readingMinutes: z.coerce.number().int().min(1).max(600),
  status: z.enum(["draft", "scheduled", "published", "archived"]),
  abstract: z.string().trim().min(20).max(2000),
  takeaways: z.array(z.string().trim().min(3).max(300)).min(1).max(8),
  subtitle: z.string().trim().max(180).default(""),
  authorName: z.string().trim().max(120).default("Signal Research Desk"),
  authorTitle: z.string().trim().max(120).default(""),
  documentType: z.enum(["whitepaper", "research_report", "case_study", "guide", "briefing"]).default("whitepaper"),
  language: z.string().trim().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/).default("en"),
  publicationDate: z.string().trim().regex(/^(?:\d{4}-\d{2}-\d{2})?$/).default(""),
  industry: z.string().trim().max(100).default(""),
  targetAudience: z.string().trim().max(180).default(""),
  geographicTarget: z.string().trim().max(180).default(""),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  sourceName: z.string().trim().max(160).default(""),
  sourceUrl: z.string().trim().max(2048).refine(isHttpUrlOrEmpty, "Source URL must use HTTP or HTTPS.").default(""),
  seoTitle: z.string().trim().max(70).default(""),
  seoDescription: z.string().trim().max(180).default(""),
  canonicalUrl: z.string().trim().max(2048).refine(isHttpUrlOrEmpty, "Canonical URL must use HTTP or HTTPS.").default(""),
  seoKeywords: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  geoSummary: z.string().trim().max(1200).default(""),
  keyEntities: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  keyFacts: z.array(z.string().trim().min(5).max(400)).max(12).default([]),
  faqItems: z.array(z.object({
    question: z.string().trim().min(5).max(240),
    answer: z.string().trim().min(10).max(800),
  })).max(10).default([]),
  coverImageUrl: z.string().trim().max(256).default(""),
  coverImageAlt: z.string().trim().max(180).default(""),
  featured: z.boolean().default(false),
  htmlContent: z.string().default(""),
  sourceDocumentUrl: z.string().trim().max(2048).refine(isHttpUrlOrEmpty, "Source document URL must use HTTP or HTTPS.").default(""),
  sourceDocumentAsset: z.string().trim().max(256).regex(/^(?:|\/api\/admin\/source-files\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf|\/pending-document)$/).default(""),
  downloadablePdfAsset: z.string().trim().max(256).regex(/^(?:|\/api\/admin\/download-files\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf|\/pending-download)$/).default(""),
  sourceDocumentTitle: z.string().trim().max(240).default(""),
  sourceRightsStatus: z.enum(rightsStatusValues).default("unknown"),
  sourceRightsEvidence: z.string().trim().max(2000).default(""),
  scheduledAt: z.string().trim().max(40).refine(isIsoTimestampOrEmpty, "Scheduled date must include an explicit timezone.").default(""),
}).superRefine((value, context) => {
  if (value.coverImageUrl && !value.coverImageAlt) {
    context.addIssue({ code: "custom", path: ["coverImageAlt"], message: "Add descriptive alt text for the cover image." });
  }
  if (!isValidDateOnly(value.publicationDate)) {
    context.addIssue({ code: "custom", path: ["publicationDate"], message: "Enter a valid publication date." });
  }
  if (value.status === "scheduled") {
    if (!value.scheduledAt || Number.isNaN(Date.parse(value.scheduledAt))) {
      context.addIssue({ code: "custom", path: ["scheduledAt"], message: "Choose a valid publication date and time." });
    } else if (Date.parse(value.scheduledAt) <= Date.now()) {
      context.addIssue({ code: "custom", path: ["scheduledAt"], message: "Scheduled publication must be in the future." });
    }
    if (value.sourceRightsStatus !== "allowed" || value.sourceRightsEvidence.length < 20) {
      context.addIssue({
        code: "custom",
        path: ["sourceRightsStatus"],
        message: "Scheduling requires approved source rights and at least 20 characters of rights evidence.",
      });
    }
  }
  if (value.status === "published" && (value.sourceRightsStatus !== "allowed" || value.sourceRightsEvidence.length < 20)) {
    context.addIssue({
      code: "custom",
      path: ["sourceRightsStatus"],
      message: "Publishing requires approved source rights and at least 20 characters of rights evidence.",
    });
  }
  if (value.sourceRightsStatus === "allowed" && value.sourceRightsEvidence.length < 20) {
    context.addIssue({
      code: "custom",
      path: ["sourceRightsEvidence"],
      message: "Approved source rights require at least 20 characters of supporting evidence.",
    });
  }
  if (value.sourceDocumentUrl && value.sourceDocumentAsset) {
    context.addIssue({
      code: "custom",
      path: ["sourceDocumentUrl"],
      message: "Use either an uploaded source PDF or a source PDF URL, not both.",
    });
  }
});

export type PaperInput = z.infer<typeof paperInputSchema>;

function isValidPublicBaseUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
    return (url.protocol === "https:" || (localHost && url.protocol === "http:"))
      && !url.username
      && !url.password
      && (url.pathname === "/" || url.pathname === "")
      && !url.search
      && !url.hash;
  } catch {
    return false;
  }
}

export const siteInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).default("signal-library"),
  description: z.string().trim().min(10).max(300),
  themeId: z.string(),
  templateId: z.string().default("default"),
  templateConfig: z.record(z.string()).default({}),
  publicUrl: z.string().trim().max(2048).default("").refine(isValidPublicBaseUrl, "Public base URL must be an HTTPS origin without a path, query, or credentials (HTTP is allowed only for localhost)."),
  tagline: z.string().trim().max(160).default(""),
  logoUrl: z.string().trim().max(2048).refine(isHttpUrlOrEmpty, "Logo URL must use HTTP or HTTPS.").default(""),
  faviconUrl: z.string().trim().max(2048).refine(isHttpUrlOrEmpty, "Favicon URL must use HTTP or HTTPS.").default(""),
  brandColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default("#1f2937"),
  accentColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default("#c8ec6d"),
  contactEmail: z.string().trim().email().or(z.literal("")).default(""),
  contactPhone: z.string().trim().max(40).default(""),
  contactAddress: z.string().trim().max(500).default(""),
  legalName: z.string().trim().max(160).default(""),
  privacyPolicy: z.string().trim().max(20000).default(""),
  termsOfUse: z.string().trim().max(20000).default(""),
  cookiePolicy: z.string().trim().max(20000).default(""),
  disclaimer: z.string().trim().max(20000).default(""),
  editorialPolicy: z.string().trim().max(20000).default(""),
  accessibilityStatement: z.string().trim().max(20000).default(""),
  indexingEnabled: z.coerce.boolean().default(false),
  socialLinks: z.array(z.object({ platform: z.string().trim().min(1).max(40), url: z.string().trim().url() })).max(10).default([]),
  emailEnabled: z.coerce.boolean().default(false),
  emailProvider: z.string().trim().max(60).default(""),
  emailApiUrl: z.string().trim().max(2048).refine(isHttpUrlOrEmpty, "Email API URL must use HTTP or HTTPS.").default(""),
  emailSecretRef: z.string().trim().regex(/^[A-Z][A-Z0-9_]{2,100}$/).or(z.literal("")).default(""),
  emailFromEmail: z.string().trim().email().or(z.literal("")).default(""),
  emailFromName: z.string().trim().max(120).default(""),
  emailReplyTo: z.string().trim().email().or(z.literal("")).default(""),
  emailApproved: z.coerce.boolean().default(false),
  privacyApproved: z.coerce.boolean().default(false),
  termsApproved: z.coerce.boolean().default(false),
  downloadEnabled: z.coerce.boolean().default(false),
  leadRetentionDays: z.coerce.number().int().min(1).max(3650).default(90),
  verificationTokenMinutes: z.coerce.number().int().min(5).max(1440).default(60),
  downloadRateLimitPerHour: z.coerce.number().int().min(1).max(10000).default(10),
  maxDownloadsPerLead: z.coerce.number().int().min(1).max(100).default(3),
}).superRefine((value, context) => {
  const preset = findThemePreset(value.themeId);
  if (!preset) {
    context.addIssue({
      code: "custom",
      path: ["themeId"],
      message: "Select a registered theme preset.",
    });
  }
});

// --- Conversion helpers ---

function paperFromDoc(doc: Record<string, unknown>): PaperRecord {
  const scheduledAt = String(doc.scheduledAt ?? "");
  return {
    id: Number(doc.numericId),
    siteId: Number(doc.siteId ?? 1),
    slug: String(doc.slug),
    title: String(doc.title),
    summary: String(doc.summary),
    category: String(doc.category),
    publisher: String(doc.publisher),
    readingMinutes: Number(doc.readingMinutes),
    publishedLabel: String(doc.publishedLabel),
    accent: doc.accent as Whitepaper["accent"],
    issue: String(doc.issue),
    abstract: String(doc.abstract),
    takeaways: (doc.takeaways as string[]) ?? [],
    status: doc.status === "draft" && scheduledAt
      ? "scheduled"
      : doc.status as PaperRecord["status"],
    editorialStatus: (doc.editorialStatus ?? (doc.status === "published" ? "approved" : "draft")) as PaperRecord["editorialStatus"],
    updatedAt: String(doc.updatedAt),
    subtitle: String(doc.subtitle ?? ""),
    authorName: String(doc.authorName ?? "Signal Research Desk"),
    authorTitle: String(doc.authorTitle ?? ""),
    documentType: (doc.documentType ?? "whitepaper") as PaperRecord["documentType"],
    language: String(doc.language ?? "en"),
    publicationDate: String(doc.publicationDate ?? ""),
    industry: String(doc.industry ?? ""),
    targetAudience: String(doc.targetAudience ?? ""),
    geographicTarget: String(doc.geographicTarget ?? ""),
    tags: (doc.tags as string[]) ?? [],
    sourceName: String(doc.sourceName ?? ""),
    sourceUrl: String(doc.sourceUrl ?? ""),
    sourceDocumentUrl: String(doc.sourceDocumentUrl ?? ""),
    sourceDocumentAsset: String(doc.sourceDocumentAsset ?? ""),
    downloadablePdfAsset: String(doc.downloadablePdfAsset ?? ""),
    sourceDocumentTitle: String(doc.sourceDocumentTitle ?? ""),
    sourceRightsStatus: (doc.sourceRightsStatus ?? "unknown") as PaperRecord["sourceRightsStatus"],
    sourceRightsEvidence: String(doc.sourceRightsEvidence ?? ""),
    scheduledAt,
    seoTitle: String(doc.seoTitle ?? ""),
    seoDescription: String(doc.seoDescription ?? ""),
    canonicalUrl: String(doc.canonicalUrl ?? ""),
    seoKeywords: (doc.seoKeywords as string[]) ?? [],
    geoSummary: String(doc.geoSummary ?? ""),
    keyEntities: (doc.keyEntities as string[]) ?? [],
    keyFacts: (doc.keyFacts as string[]) ?? [],
    faqItems: ((doc.faqItems as Array<Record<string, unknown>>) ?? []).map((item) => ({
      question: String(item.question),
      answer: String(item.answer),
    })),
    coverImageUrl: String(doc.coverImageUrl ?? ""),
    coverImageAlt: String(doc.coverImageAlt ?? ""),
    featured: Boolean(doc.featured),
  };
}

function siteFromDoc(doc: Record<string, unknown>): SiteRecord {
  return {
    id: Number(doc.numericId),
    name: String(doc.name),
    slug: String(doc.slug),
    description: String(doc.description),
    themeId: String(doc.themeId),
    templateId: String(doc.templateId ?? "default"),
    templateConfig: (doc.templateConfig && typeof doc.templateConfig === "object") ? doc.templateConfig as Record<string, string> : {},
    publicUrl: String(doc.publicUrl ?? ""),
    tagline: String(doc.tagline ?? ""),
    logoUrl: String(doc.logoUrl ?? ""),
    faviconUrl: String(doc.faviconUrl ?? ""),
    brandColor: String(doc.brandColor ?? "#1f2937"),
    accentColor: String(doc.accentColor ?? "#c8ec6d"),
    contactEmail: String(doc.contactEmail ?? ""),
    contactPhone: String(doc.contactPhone ?? ""),
    contactAddress: String(doc.contactAddress ?? ""),
    legalName: String(doc.legalName ?? ""),
    privacyPolicy: String(doc.privacyPolicy ?? ""),
    termsOfUse: String(doc.termsOfUse ?? ""),
    cookiePolicy: String(doc.cookiePolicy ?? ""),
    disclaimer: String(doc.disclaimer ?? ""),
    editorialPolicy: String(doc.editorialPolicy ?? ""),
    accessibilityStatement: String(doc.accessibilityStatement ?? ""),
    indexingEnabled: Boolean(doc.indexingEnabled),
    socialLinks: (doc.socialLinks as Array<{ platform: string; url: string }>) ?? [],
    emailEnabled: Boolean(doc.emailEnabled),
    emailProvider: String(doc.emailProvider ?? ""),
    emailApiUrl: String(doc.emailApiUrl ?? ""),
    emailSecretRef: String(doc.emailSecretRef ?? ""),
    emailFromEmail: String(doc.emailFromEmail ?? ""),
    emailFromName: String(doc.emailFromName ?? ""),
    emailReplyTo: String(doc.emailReplyTo ?? ""),
    emailApproved: Boolean(doc.emailApproved), privacyApproved: Boolean(doc.privacyApproved), termsApproved: Boolean(doc.termsApproved), downloadEnabled: Boolean(doc.downloadEnabled),
    leadRetentionDays: Number(doc.leadRetentionDays ?? 90), verificationTokenMinutes: Number(doc.verificationTokenMinutes ?? 60), downloadRateLimitPerHour: Number(doc.downloadRateLimitPerHour ?? 10), maxDownloadsPerLead: Number(doc.maxDownloadsPerLead ?? 3),
    updatedAt: String(doc.updatedAt),
  };
}

function sourceDocumentFromDoc(doc: Record<string, unknown>): SourceDocumentRecord {
  return {
    id: Number(doc.numericId),
    title: String(doc.title),
    originalFilename: String(doc.originalFilename ?? ""),
    sourceUrl: String(doc.sourceUrl ?? ""),
    sourceAsset: String(doc.sourceAsset ?? ""),
    rightsStatus: (doc.rightsStatus ?? "unknown") as SourceDocumentRecord["rightsStatus"],
    rightsEvidence: String(doc.rightsEvidence ?? ""),
    scheduledAt: String(doc.scheduledAt ?? ""),
    targetSiteSlugs: (doc.targetSiteSlugs as string[]) ?? [],
    status: (doc.status ?? "ready") as SourceDocumentRecord["status"],
    error: String(doc.error ?? ""),
    generatedPaperIds: (doc.generatedPaperIds as number[]) ?? [],
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
  };
}

// --- Database initialization ---

let initialized = false;

export async function initializeDatabase(): Promise<void> {
  await connectDatabase();
  if (initialized) return;
  initialized = true;

  // Seed default site
  const existingSite = await Site.findOne({ slug: "signal-library" }).lean();
  if (!existingSite) {
    const siteId = await nextId("site");
    await Site.create({
      numericId: siteId,
      name: "Signal Library",
      slug: "signal-library",
      description: "Explore practical research, industry briefings, and evidence-led guides for modern teams.",
      themeId: "research-report-index",
      publicUrl: "",
      tagline: "Research for better decisions",
      indexingEnabled: false,
      emailEnabled: false,
      leadRetentionDays: 90, verificationTokenMinutes: 60, downloadRateLimitPerHour: 10, maxDownloadsPerLead: 3,
      updatedAt: new Date().toISOString(),
    });
  }

  // Seed sample papers
  const now = new Date().toISOString();
  for (const paper of samplePapers) {
    const exists = await WhitepaperModel.findOne({ slug: paper.slug, siteId: 1 }).lean();
    if (!exists) {
      const paperId = await nextId("whitepaper");
      await WhitepaperModel.create({
        numericId: paperId,
        siteId: 1,
        slug: paper.slug,
        title: paper.title,
        summary: paper.summary,
        category: paper.category,
        publisher: paper.publisher,
        readingMinutes: paper.readingMinutes,
        publishedLabel: paper.publishedLabel,
        accent: paper.accent,
        issue: paper.issue,
        abstract: paper.abstract,
        takeaways: paper.takeaways,
        status: "published",
        editorialStatus: "approved",
        updatedAt: now,
        sourceRightsStatus: "allowed",
        sourceRightsEvidence: "Synthetic demonstration content created for this local prototype; no external source material.",
      });
    }
  }
}

async function ensureInitialized(): Promise<void> {
  if (!initialized) await initializeDatabase();
}

// --- Audit ---

async function recordAuditEvent(
  actor: string,
  action: string,
  entity: string,
  entityId: string,
  occurredAt: string,
  correlationId = "",
  detail = "",
): Promise<void> {
  const id = await nextId("audit");
  await AuditEvent.create({
    numericId: id,
    actor,
    action,
    entity,
    entityId,
    occurredAt,
    correlationId,
    detail: detail.slice(0, 2000),
  });
}

export function newCorrelationId(): string {
  return randomUUID().slice(0, 8);
}

export async function listLocalAuditEvents(limit = 20): Promise<Array<{
  id: number;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  occurredAt: string;
  correlationId: string;
  detail: string;
}>> {
  await ensureInitialized();
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const docs = await AuditEvent.find().sort({ numericId: -1 }).limit(safeLimit).lean();
  return docs.map((doc) => ({
    id: Number(doc.numericId),
    actor: String(doc.actor),
    action: String(doc.action),
    entity: String(doc.entity),
    entityId: String(doc.entityId),
    occurredAt: String(doc.occurredAt),
    correlationId: String(doc.correlationId ?? ""),
    detail: String(doc.detail ?? ""),
  }));
}

// --- Sites ---

async function ensureSiteExists(siteId: number): Promise<void> {
  const site = await Site.findOne({ numericId: siteId }).lean();
  if (!site) throw new RequestValidationError("Choose a site registered in this workspace.");
}

export async function getSite(): Promise<SiteRecord> {
  await ensureInitialized();
  const doc = await Site.findOne({ slug: "signal-library" }).lean();
  if (!doc) throw new Error("Default site record has not been initialized.");
  return siteFromDoc(doc as Record<string, unknown>);
}

export async function findSiteById(id: number): Promise<SiteRecord | undefined> {
  await ensureInitialized();
  const doc = await Site.findOne({ numericId: id }).lean();
  return doc ? siteFromDoc(doc as Record<string, unknown>) : undefined;
}

export async function listSites(): Promise<SiteRecord[]> {
  await ensureInitialized();
  const docs = await Site.find().sort({ name: 1 }).collation({ locale: "en", strength: 2 }).lean();
  return docs.map((doc) => siteFromDoc(doc as Record<string, unknown>));
}

export async function listSitesPaginated(
  page: number = 1,
  limit: number = 50,
  search?: string
): Promise<{ sites: SiteRecord[]; total: number; pages: number }> {
  await ensureInitialized();
  const pageNum = Math.max(1, page);
  const pageSize = Math.min(Math.max(1, limit), 100);
  const skip = (pageNum - 1) * pageSize;

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
          { publicUrl: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [docs, total] = await Promise.all([
    Site.find(query)
      .sort({ updatedAt: -1, name: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Site.countDocuments(query),
  ]);

  const sites = docs.map((doc) => siteFromDoc(doc as Record<string, unknown>));
  const pages = Math.ceil(total / pageSize);

  return { sites, total, pages };
}

export async function resolveSiteForHost(hostHeader: string | null | undefined): Promise<SiteRecord | undefined> {
  await ensureInitialized();
  const hostValue = hostHeader?.trim();
  if (!hostValue || hostValue.length > 255 || /[\s,/@\\]/.test(hostValue)) return undefined;
  let hostname: string;
  try {
    hostname = new URL(`http://${hostValue}`).hostname.toLowerCase();
  } catch {
    return undefined;
  }

  const candidates = await Site.find({
    publicUrl: { $ne: "", $regex: hostname, $options: "i" },
  }).lean();

  const site = candidates.find((row) => {
    try {
      return new URL(String(row.publicUrl)).hostname.toLowerCase() === hostname;
    } catch {
      return false;
    }
  });
  if (site) return siteFromDoc(site as Record<string, unknown>);
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname)) return getSite();
  return undefined;
}

export async function createSite(input: z.input<typeof siteInputSchema>): Promise<SiteRecord> {
  await ensureInitialized();
  const parsed = siteInputSchema.parse(input);
  const now = new Date().toISOString();
  const preset = findThemePreset(parsed.themeId);
  if (process.env.NODE_ENV === "production" && preset?.status !== "approved") {
    throw new Error("Production site configuration accepts only formally approved theme presets.");
  }
  const publicUrl = parsed.publicUrl ? new URL(parsed.publicUrl).origin : "";

  // Check uniqueness
  const existingSlug = await Site.findOne({ slug: parsed.slug }).lean();
  if (existingSlug) throw new RequestValidationError("That site slug or public domain is already registered.");
  if (publicUrl) {
    const existingUrl = await Site.findOne({ publicUrl }).lean();
    if (existingUrl) throw new RequestValidationError("That site slug or public domain is already registered.");
  }

  const siteId = await nextId("site");
  await Site.create({
    numericId: siteId,
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description,
    themeId: parsed.themeId,
    templateId: parsed.templateId,
    templateConfig: parsed.templateConfig,
    publicUrl,
    tagline: parsed.tagline,
    logoUrl: parsed.logoUrl,
    faviconUrl: parsed.faviconUrl,
    brandColor: parsed.brandColor,
    accentColor: parsed.accentColor,
    contactEmail: parsed.contactEmail,
    contactPhone: parsed.contactPhone,
    contactAddress: parsed.contactAddress,
    legalName: parsed.legalName,
    privacyPolicy: parsed.privacyPolicy,
    termsOfUse: parsed.termsOfUse,
    cookiePolicy: parsed.cookiePolicy,
    disclaimer: parsed.disclaimer,
    editorialPolicy: parsed.editorialPolicy,
    accessibilityStatement: parsed.accessibilityStatement,
    indexingEnabled: parsed.indexingEnabled,
    socialLinks: parsed.socialLinks,
    emailEnabled: parsed.emailEnabled, emailProvider: parsed.emailProvider, emailApiUrl: parsed.emailApiUrl, emailSecretRef: parsed.emailSecretRef, emailFromEmail: parsed.emailFromEmail, emailFromName: parsed.emailFromName, emailReplyTo: parsed.emailReplyTo,
    emailApproved: parsed.emailApproved, privacyApproved: parsed.privacyApproved, termsApproved: parsed.termsApproved, downloadEnabled: parsed.downloadEnabled, leadRetentionDays: parsed.leadRetentionDays, verificationTokenMinutes: parsed.verificationTokenMinutes, downloadRateLimitPerHour: parsed.downloadRateLimitPerHour, maxDownloadsPerLead: parsed.maxDownloadsPerLead,
    updatedAt: now,
  });
  await recordAuditEvent("local-admin", "created", "site", String(siteId), now);
  const site = await findSiteById(siteId);
  if (!site) throw new Error("Site was inserted but could not be retrieved.");
  return site;
}

export async function updateSite(input: z.input<typeof siteInputSchema>, siteId?: number): Promise<SiteRecord> {
  await ensureInitialized();
  const resolvedSiteId = siteId ?? (await getSite()).id;
  const parsed = siteInputSchema.parse(input);
  const currentSite = await findSiteById(resolvedSiteId);
  if (!currentSite) throw new Error("Site not found.");
  if (parsed.slug !== currentSite.slug) {
    throw new RequestValidationError("Site slugs are immutable because source targets and generated draft routes reference them.");
  }
  const preset = findThemePreset(parsed.themeId);
  if (process.env.NODE_ENV === "production" && preset?.status !== "approved") {
    throw new Error("Production site configuration accepts only formally approved theme presets.");
  }
  const now = new Date().toISOString();
  const publicUrl = parsed.publicUrl ? new URL(parsed.publicUrl).origin : "";

  // Check uniqueness for publicUrl (excluding self)
  if (publicUrl) {
    const existing = await Site.findOne({ publicUrl, numericId: { $ne: resolvedSiteId } }).lean();
    if (existing) throw new RequestValidationError("That site slug or public domain is already registered.");
  }

  const result = await Site.updateOne(
    { numericId: resolvedSiteId },
    { ...parsed, publicUrl, updatedAt: now },
  );
  if (result.matchedCount === 0) throw new Error("Site not found.");
  await recordAuditEvent("local-admin", "updated", "site", String(resolvedSiteId), now);
  const site = await findSiteById(resolvedSiteId);
  if (!site) throw new Error("Site was updated but could not be retrieved.");
  return site;
}

export async function deleteSite(siteId: number): Promise<boolean> {
  await ensureInitialized();
  const site = await findSiteById(siteId);
  if (!site) return false;

  const now = new Date().toISOString();
  const result = await Site.deleteOne({ numericId: siteId });
  if (result.deletedCount === 0) return false;

  await recordAuditEvent("local-admin", "deleted", "site", String(siteId), now);
  return true;
}

// --- Whitepapers ---

export async function listWhitepapers(options: { includeNonPublic?: boolean; siteId?: number } = {}): Promise<PaperRecord[]> {
  await ensureInitialized();
  await publishDueScheduledPapers();
  const filter: Record<string, unknown> = {};
  if (options.siteId !== undefined) filter.siteId = options.siteId;
  if (!options.includeNonPublic) {
    filter.status = "published";
    filter.editorialStatus = "approved";
  }
  const sort: Record<string, 1 | -1> = options.includeNonPublic ? { updatedAt: -1, numericId: -1 } : { issue: 1 };
  const docs = await WhitepaperModel.find(filter).sort(sort).lean();
  return docs.map((doc) => paperFromDoc(doc as Record<string, unknown>));
}

export async function findWhitepaperRecord(slug: string): Promise<PaperRecord | undefined> {
  const siteId = (await getSite()).id;
  return findWhitepaperRecordForSite(slug, siteId);
}

export async function findWhitepaperRecordForSite(slug: string, siteId: number): Promise<PaperRecord | undefined> {
  await ensureInitialized();
  await publishDueScheduledPapers();
  const doc = await WhitepaperModel.findOne({ slug, siteId, status: "published", editorialStatus: "approved" }).lean();
  return doc ? paperFromDoc(doc as Record<string, unknown>) : undefined;
}

export async function findWhitepaperById(id: number): Promise<PaperRecord | undefined> {
  await ensureInitialized();
  const doc = await WhitepaperModel.findOne({ numericId: id }).lean();
  return doc ? paperFromDoc(doc as Record<string, unknown>) : undefined;
}

async function getWhitepaperById(id: number): Promise<PaperRecord> {
  const doc = await WhitepaperModel.findOne({ numericId: id }).lean();
  if (!doc) throw new Error("Whitepaper not found after persistence operation.");
  return paperFromDoc(doc as Record<string, unknown>);
}

const editorialContentKeys: Array<keyof PaperInput> = [
  "siteId", "title", "slug", "summary", "category", "publisher", "readingMinutes", "abstract", "takeaways",
  "subtitle", "authorName", "authorTitle", "documentType", "language", "publicationDate", "industry",
  "targetAudience", "geographicTarget", "tags", "sourceName", "sourceUrl", "seoTitle", "seoDescription",
  "canonicalUrl", "seoKeywords", "geoSummary", "keyEntities", "keyFacts", "faqItems", "coverImageUrl",
  "coverImageAlt", "featured", "sourceDocumentUrl", "sourceDocumentAsset", "downloadablePdfAsset", "sourceDocumentTitle",
  "sourceRightsStatus", "sourceRightsEvidence",
];

function hasEditorialContentChanged(existing: PaperRecord, input: PaperInput): boolean {
  return editorialContentKeys.some((key) => JSON.stringify(existing[key]) !== JSON.stringify(input[key]));
}

function ensureRightsCleared(input: PaperInput | PaperRecord): void {
  if (input.sourceRightsStatus !== "allowed" || input.sourceRightsEvidence.length < 20) {
    throw new RequestValidationError("Editorial review requires approved source rights and at least 20 characters of rights evidence.");
  }
}

export async function createWhitepaper(input: PaperInput): Promise<PaperRecord> {
  await ensureInitialized();
  if (input.status !== "draft") {
    throw new RequestValidationError("New entries must start as drafts and pass editorial review before scheduling or publishing.");
  }
  const now = new Date().toISOString();
  await ensureSiteExists(input.siteId);
  const paperId = await nextId("whitepaper");
  const sourceDocumentAsset = input.sourceDocumentAsset === "/pending-document" ? "" : input.sourceDocumentAsset;
  const downloadablePdfAsset = input.downloadablePdfAsset === "/pending-download" ? "" : input.downloadablePdfAsset;
  await WhitepaperModel.create({
    numericId: paperId,
    siteId: input.siteId,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    category: input.category,
    publisher: input.publisher,
    readingMinutes: input.readingMinutes,
    publishedLabel: "Editorial brief · 2026",
    accent: "mint",
    issue: `N${String(Date.now()).slice(-3)}`,
    abstract: input.abstract,
    takeaways: input.takeaways,
    status: "draft",
    editorialStatus: "draft",
    updatedAt: now,
    subtitle: input.subtitle,
    authorName: input.authorName,
    authorTitle: input.authorTitle,
    documentType: input.documentType,
    language: input.language,
    publicationDate: input.publicationDate,
    industry: input.industry,
    targetAudience: input.targetAudience,
    geographicTarget: input.geographicTarget,
    tags: input.tags,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    canonicalUrl: input.canonicalUrl,
    seoKeywords: input.seoKeywords,
    geoSummary: input.geoSummary,
    keyEntities: input.keyEntities,
    keyFacts: input.keyFacts,
    faqItems: input.faqItems,
    coverImageUrl: input.coverImageUrl,
    coverImageAlt: input.coverImageAlt,
    featured: input.featured,
    sourceDocumentUrl: input.sourceDocumentUrl,
    sourceDocumentAsset,
    downloadablePdfAsset,
    sourceDocumentTitle: input.sourceDocumentTitle,
    sourceRightsStatus: input.sourceRightsStatus,
    sourceRightsEvidence: input.sourceRightsEvidence,
    scheduledAt: (input.status as string) === "scheduled" ? input.scheduledAt : "",
    htmlContent: input.htmlContent || "",
  });
  await recordAuditEvent("local-admin", "created", "whitepaper", String(paperId), now);
  return getWhitepaperById(paperId);
}

export async function updateWhitepaper(id: number, input: PaperInput): Promise<PaperRecord> {
  await ensureInitialized();
  const now = new Date().toISOString();
  const existing = await findWhitepaperById(id);
  if (!existing) throw new Error("Whitepaper not found.");
  await ensureSiteExists(input.siteId);
  if (input.status === "published" || input.status === "scheduled") {
    assertKillSwitchOff("publish");
  }
  if ((input.status === "scheduled" || input.status === "published") && existing.editorialStatus !== "approved") {
    throw new RequestValidationError("Submit this entry for editorial review and approve it before scheduling or publishing.");
  }
  const contentChanged = hasEditorialContentChanged(existing, input);
  if (input.status === "scheduled" || input.status === "published") ensureRightsCleared(input);
  const effectiveInput = contentChanged
    ? { ...input, status: input.status === "archived" ? "archived" as const : "draft" as const, scheduledAt: "" }
    : input;
  const nextEditorialStatus = contentChanged ? "draft" : existing.editorialStatus;
  const sourceDocumentAsset = effectiveInput.sourceDocumentAsset === "/pending-document" ? "" : effectiveInput.sourceDocumentAsset;
  const downloadablePdfAsset = effectiveInput.downloadablePdfAsset === "/pending-download" ? "" : effectiveInput.downloadablePdfAsset;

  const result = await WhitepaperModel.updateOne(
    { numericId: id },
    {
      siteId: input.siteId,
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      category: input.category,
      publisher: input.publisher,
      readingMinutes: input.readingMinutes,
      abstract: input.abstract,
      takeaways: input.takeaways,
      status: (effectiveInput.status as string) === "scheduled" ? "draft" : effectiveInput.status,
      editorialStatus: nextEditorialStatus,
      updatedAt: now,
      subtitle: input.subtitle,
      authorName: input.authorName,
      authorTitle: input.authorTitle,
      documentType: input.documentType,
      language: input.language,
      publicationDate: input.publicationDate,
      industry: input.industry,
      targetAudience: input.targetAudience,
      geographicTarget: input.geographicTarget,
      tags: input.tags,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      canonicalUrl: input.canonicalUrl,
      seoKeywords: input.seoKeywords,
      geoSummary: input.geoSummary,
      keyEntities: input.keyEntities,
      keyFacts: input.keyFacts,
      faqItems: input.faqItems,
      coverImageUrl: input.coverImageUrl,
      coverImageAlt: input.coverImageAlt,
      featured: input.featured,
      sourceDocumentUrl: input.sourceDocumentUrl,
      sourceDocumentAsset,
      downloadablePdfAsset,
      sourceDocumentTitle: input.sourceDocumentTitle,
      sourceRightsStatus: input.sourceRightsStatus,
      sourceRightsEvidence: input.sourceRightsEvidence,
      scheduledAt: (effectiveInput.status as string) === "scheduled" ? effectiveInput.scheduledAt : "",
    },
  );
  if (result.matchedCount === 0) throw new Error("Whitepaper not found.");
  await recordAuditEvent("local-admin", "updated", "whitepaper", String(id), now);
  return getWhitepaperById(id);
}

export async function deleteWhitepaper(id: number): Promise<void> {
  await ensureInitialized();
  const now = new Date().toISOString();
  const result = await WhitepaperModel.deleteOne({ numericId: id });
  if (result.deletedCount === 0) throw new Error("Whitepaper not found.");

  // Update source documents that reference this paper
  const sources = await SourceDocument.find({ generatedPaperIds: id }).lean();
  for (const source of sources) {
    const remainingIds = (source.generatedPaperIds as number[]).filter((paperId) => paperId !== id);
    await SourceDocument.updateOne(
      { numericId: source.numericId },
      {
        generatedPaperIds: remainingIds,
        status: remainingIds.length ? "generated" : (source.scheduledAt ? "scheduled" : "ready"),
        updatedAt: now,
      },
    );
  }
  await recordAuditEvent("local-admin", "deleted", "whitepaper", String(id), now);
}

// --- Editorial review ---

export type EditorialReviewEvent = {
  id: number;
  paperId: number;
  siteId: number;
  action: "submitted" | "approved" | "changes_requested";
  actor: string;
  note: string;
  occurredAt: string;
};

export async function listEditorialReviewEvents(paperId: number): Promise<EditorialReviewEvent[]> {
  await ensureInitialized();
  const docs = await EditorialReviewEvent.find({ paperId }).sort({ numericId: 1 }).lean();
  return docs.map((doc) => ({
    id: Number(doc.numericId),
    paperId: Number(doc.paperId),
    siteId: Number(doc.siteId),
    action: doc.action as EditorialReviewEvent["action"],
    actor: String(doc.actor),
    note: String(doc.note),
    occurredAt: String(doc.occurredAt),
  }));
}

async function recordEditorialReviewEvent(
  paper: PaperRecord,
  action: EditorialReviewEvent["action"],
  note: string,
  occurredAt: string,
): Promise<void> {
  const id = await nextId("editorialReview");
  await EditorialReviewEvent.create({
    numericId: id,
    paperId: paper.id,
    siteId: paper.siteId,
    action,
    actor: "local-admin",
    note,
    occurredAt,
  });
  await recordAuditEvent("local-admin", `editorial-${action.replaceAll("_", "-")}`, "whitepaper", String(paper.id), occurredAt, "", note);
}

export async function submitWhitepaperForReview(id: number): Promise<PaperRecord> {
  await ensureInitialized();
  const paper = await findWhitepaperById(id);
  if (!paper) throw new Error("Whitepaper not found.");
  if (paper.editorialStatus !== "draft" && paper.editorialStatus !== "changes_requested") {
    throw new RequestValidationError("Only a draft or a returned entry can be submitted for review.");
  }
  ensureRightsCleared(paper);
  const now = new Date().toISOString();
  const result = await WhitepaperModel.updateOne(
    { numericId: id, editorialStatus: { $in: ["draft", "changes_requested"] } },
    { editorialStatus: "in_review", updatedAt: now },
  );
  if (result.matchedCount !== 1) throw new RequestValidationError("The editorial status changed; reload and try again.");
  await recordEditorialReviewEvent(paper, "submitted", "", now);
  return getWhitepaperById(id);
}

export async function approveWhitepaperReview(id: number): Promise<PaperRecord> {
  await ensureInitialized();
  const paper = await findWhitepaperById(id);
  if (!paper) throw new Error("Whitepaper not found.");
  if (paper.editorialStatus !== "in_review") {
    throw new RequestValidationError("Only an entry currently in review can be approved.");
  }
  ensureRightsCleared(paper);
  const now = new Date().toISOString();
  const result = await WhitepaperModel.updateOne(
    { numericId: id, editorialStatus: "in_review" },
    { editorialStatus: "approved", updatedAt: now },
  );
  if (result.matchedCount !== 1) throw new RequestValidationError("The editorial status changed; reload and try again.");
  await recordEditorialReviewEvent(paper, "approved", "", now);
  return getWhitepaperById(id);
}

export async function requestWhitepaperChanges(id: number, note: string): Promise<PaperRecord> {
  await ensureInitialized();
  const normalizedNote = note.trim();
  if (normalizedNote.length < 5 || normalizedNote.length > 1000) {
    throw new RequestValidationError("Add a review note between 5 and 1000 characters.");
  }
  const paper = await findWhitepaperById(id);
  if (!paper) throw new Error("Whitepaper not found.");
  if (paper.editorialStatus !== "in_review") {
    throw new RequestValidationError("Changes can only be requested while an entry is in review.");
  }
  const now = new Date().toISOString();
  const result = await WhitepaperModel.updateOne(
    { numericId: id, editorialStatus: "in_review" },
    { editorialStatus: "changes_requested", updatedAt: now },
  );
  if (result.matchedCount !== 1) throw new RequestValidationError("The editorial status changed; reload and try again.");
  await recordEditorialReviewEvent(paper, "changes_requested", normalizedNote, now);
  return getWhitepaperById(id);
}

export async function publishDueScheduledPapers(currentTime = new Date()): Promise<void> {
  try { assertKillSwitchOff("publish"); } catch { return; }
  await ensureInitialized();
  const now = currentTime.toISOString();
  const due = await WhitepaperModel.find({
    status: "draft",
    scheduledAt: { $ne: "", $lte: now },
    editorialStatus: "approved",
    sourceRightsStatus: "allowed",
    $expr: { $gte: [{ $strLenCP: "$sourceRightsEvidence" }, 20] },
  }).lean();

  for (const paper of due) {
    const publicationDate = (paper.publicationDate as string) || (paper.scheduledAt as string).slice(0, 10);
    await WhitepaperModel.updateOne(
      { numericId: paper.numericId },
      {
        status: "published",
        publicationDate,
        scheduledAt: "",
        updatedAt: now,
      },
    );
    await recordAuditEvent("local-scheduler", "published", "whitepaper", String(paper.numericId), now);
  }
}

// --- Source Documents ---

export async function listSourceDocuments(): Promise<SourceDocumentRecord[]> {
  await ensureInitialized();
  const docs = await SourceDocument.find().sort({ createdAt: -1, numericId: -1 }).lean();
  return docs.map((doc) => sourceDocumentFromDoc(doc as Record<string, unknown>));
}

export async function findSourceDocumentById(id: number): Promise<SourceDocumentRecord | undefined> {
  await ensureInitialized();
  const doc = await SourceDocument.findOne({ numericId: id }).lean();
  return doc ? sourceDocumentFromDoc(doc as Record<string, unknown>) : undefined;
}

async function ensureSourceScheduleDateIsUnique(scheduledAt: string, excludedId = 0): Promise<void> {
  const utcDate = new Date(scheduledAt).toISOString().slice(0, 10);
  const conflict = await SourceDocument.findOne({
    numericId: { $ne: excludedId },
    scheduledAt: { $ne: "" },
    $expr: { $eq: [{ $substr: ["$scheduledAt", 0, 10] }, utcDate] },
  }).lean();
  if (conflict) {
    throw new RequestValidationError("Another source is already scheduled on this calendar date. Choose a different date.");
  }
}

export async function createSourceDocument(input: z.infer<typeof sourceDocumentInputSchema>): Promise<SourceDocumentRecord> {
  assertKillSwitchOff("ingest");
  await ensureInitialized();
  const parsed = sourceDocumentInputSchema.parse(input);
  await ensureSourceScheduleDateIsUnique(parsed.scheduledAt);

  // Validate target site slugs
  const knownSites = await Site.find({ slug: { $in: parsed.targetSiteSlugs } }).lean();
  if (knownSites.length !== new Set(parsed.targetSiteSlugs).size) {
    throw new RequestValidationError("Select only sites registered in this workspace.");
  }

  const now = new Date().toISOString();
  const docId = await nextId("sourceDocument");
  await SourceDocument.create({
    numericId: docId,
    title: parsed.title,
    originalFilename: parsed.originalFilename,
    sourceUrl: parsed.sourceUrl,
    sourceAsset: parsed.sourceAsset,
    rightsStatus: parsed.rightsStatus,
    rightsEvidence: parsed.rightsEvidence,
    scheduledAt: parsed.scheduledAt,
    targetSiteSlugs: parsed.targetSiteSlugs,
    status: parsed.scheduledAt ? "scheduled" : "ready",
    error: "",
    generatedPaperIds: [],
    createdAt: now,
    updatedAt: now,
  });
  await recordAuditEvent("local-admin", "created", "source-document", String(docId), now);
  return (await findSourceDocumentById(docId))!;
}

export async function updateSourceDocument(id: number, input: z.infer<typeof sourceDocumentInputSchema>): Promise<SourceDocumentRecord> {
  await ensureInitialized();
  const parsed = sourceDocumentInputSchema.parse(input);
  const existing = await findSourceDocumentById(id);
  if (!existing) throw new Error("Source document not found.");
  if (existing.status === "processing") {
    throw new RequestValidationError("This source is being processed and cannot be edited yet.");
  }
  const generationInputsChanged = existing.title !== parsed.title
    || existing.sourceUrl !== parsed.sourceUrl
    || existing.sourceAsset !== parsed.sourceAsset
    || existing.rightsStatus !== parsed.rightsStatus
    || existing.rightsEvidence !== parsed.rightsEvidence
    || JSON.stringify([...existing.targetSiteSlugs].sort()) !== JSON.stringify([...parsed.targetSiteSlugs].sort());
  if (existing.status === "generated" && generationInputsChanged) {
    throw new RequestValidationError("This source already has generated drafts. Delete those drafts before changing its source or target sites.");
  }
  await ensureSourceScheduleDateIsUnique(parsed.scheduledAt, id);

  const knownSites = await Site.find({ slug: { $in: parsed.targetSiteSlugs } }).lean();
  if (knownSites.length !== new Set(parsed.targetSiteSlugs).size) {
    throw new RequestValidationError("Select only sites registered in this workspace.");
  }

  const now = new Date().toISOString();
  const result = await SourceDocument.updateOne(
    { numericId: id },
    {
      title: parsed.title,
      originalFilename: parsed.originalFilename,
      sourceUrl: parsed.sourceUrl,
      sourceAsset: parsed.sourceAsset,
      rightsStatus: parsed.rightsStatus,
      rightsEvidence: parsed.rightsEvidence,
      scheduledAt: parsed.scheduledAt,
      targetSiteSlugs: parsed.targetSiteSlugs,
      status: existing.status === "generated" ? "generated" : parsed.scheduledAt ? "scheduled" : "ready",
      error: existing.status === "generated" ? existing.error : "",
      generatedPaperIds: existing.generatedPaperIds,
      updatedAt: now,
    },
  );
  if (result.matchedCount === 0) throw new Error("Source document not found.");
  await recordAuditEvent("local-admin", "updated", "source-document", String(id), now);
  return (await findSourceDocumentById(id))!;
}

export async function markSourceDocumentGenerated(id: number, paperIds: number[]): Promise<void> {
  await ensureInitialized();
  const now = new Date().toISOString();
  const result = await SourceDocument.updateOne(
    { numericId: id },
    { status: "generated", error: "", generatedPaperIds: paperIds, updatedAt: now },
  );
  if (result.matchedCount === 0) throw new Error("Source document not found.");
  await recordAuditEvent("local-ai-workflow", "drafts-generated", "source-document", String(id), now);
}

export async function claimSourceDocumentGeneration(id: number): Promise<boolean> {
  await ensureInitialized();
  const now = new Date().toISOString();
  const result = await SourceDocument.updateOne(
    { numericId: id, status: { $in: ["ready", "scheduled", "failed"] } },
    { status: "processing", error: "", updatedAt: now },
  );
  return result.matchedCount === 1;
}

export async function markSourceDocumentFailed(id: number, error: string): Promise<void> {
  await ensureInitialized();
  const now = new Date().toISOString();
  const result = await SourceDocument.updateOne(
    { numericId: id },
    { status: "failed", error: error.slice(0, 500), updatedAt: now },
  );
  if (result.matchedCount === 0) throw new Error("Source document not found.");
}

export async function deleteSourceDocument(id: number): Promise<void> {
  await ensureInitialized();
  const existing = await findSourceDocumentById(id);
  if (existing?.status === "processing") {
    throw new RequestValidationError("This source is being processed and cannot be deleted yet.");
  }
  if (existing?.generatedPaperIds.length) {
    throw new RequestValidationError("Delete this source's generated content drafts before removing the source record.");
  }
  const now = new Date().toISOString();
  const result = await SourceDocument.deleteOne({ numericId: id });
  if (result.deletedCount === 0) throw new Error("Source document not found.");
  await recordAuditEvent("local-admin", "deleted", "source-document", String(id), now);
}

// Provenance tracking for source documents
export async function addSourceProvenance(
  id: number,
  action: string,
  actor: string,
  detail: string,
): Promise<void> {
  await ensureInitialized();
  const timestamp = new Date().toISOString();
  await SourceDocument.updateOne(
    { numericId: id },
    {
      $push: {
        provenanceLog: { action, actor, timestamp, detail },
      },
    },
  );
}

export async function setSourceMalwareScanResult(
  id: number,
  result: "clean" | "infected" | "error" | "skipped",
  actor: string,
): Promise<void> {
  await ensureInitialized();
  await SourceDocument.updateOne(
    { numericId: id },
    {
      malwareScanResult: result,
      $push: {
        provenanceLog: {
          action: "scanned",
          actor,
          timestamp: new Date().toISOString(),
          detail: `Malware scan completed: ${result}`,
        },
      },
    },
  );
}

export async function setSourceEncryption(id: number, enabled: boolean, actor: string): Promise<void> {
  await ensureInitialized();
  await SourceDocument.updateOne(
    { numericId: id },
    {
      encryptionEnabled: enabled,
      $push: {
        provenanceLog: {
          action: "encrypted",
          actor,
          timestamp: new Date().toISOString(),
          detail: enabled ? "File encrypted at rest" : "Encryption disabled",
        },
      },
    },
  );
}
