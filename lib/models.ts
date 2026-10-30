import mongoose, { Schema, type Document } from "mongoose";

// --- Counter for auto-increment IDs ---
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.models.Counter ?? mongoose.model("Counter", counterSchema);

export async function nextId(name: string): Promise<number> {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true },
  );
  return counter.seq;
}

// --- Site ---
export interface ISite extends Document {
  numericId: number;
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
  socialLinks: { platform: string; url: string }[];
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
}

const siteSchema = new Schema<ISite>({
  numericId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  themeId: { type: String, required: true },
  templateId: { type: String, default: "default" },
  templateConfig: { type: Object, default: {} },
  publicUrl: { type: String, default: "" },
  tagline: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  faviconUrl: { type: String, default: "" },
  brandColor: { type: String, default: "#1f2937" },
  accentColor: { type: String, default: "#c8ec6d" },
  contactEmail: { type: String, default: "" },
  contactPhone: { type: String, default: "" },
  contactAddress: { type: String, default: "" },
  legalName: { type: String, default: "" },
  privacyPolicy: { type: String, default: "" },
  termsOfUse: { type: String, default: "" },
  cookiePolicy: { type: String, default: "" },
  disclaimer: { type: String, default: "" },
  editorialPolicy: { type: String, default: "" },
  accessibilityStatement: { type: String, default: "" },
  indexingEnabled: { type: Boolean, default: false },
  socialLinks: { type: [{ platform: String, url: String }], default: [] },
  emailEnabled: { type: Boolean, default: false },
  emailProvider: { type: String, default: "" },
  emailApiUrl: { type: String, default: "" },
  emailSecretRef: { type: String, default: "" },
  emailFromEmail: { type: String, default: "" },
  emailFromName: { type: String, default: "" },
  emailReplyTo: { type: String, default: "" },
  emailApproved: { type: Boolean, default: false },
  privacyApproved: { type: Boolean, default: false },
  termsApproved: { type: Boolean, default: false },
  downloadEnabled: { type: Boolean, default: false },
  leadRetentionDays: { type: Number, default: 90 },
  verificationTokenMinutes: { type: Number, default: 60 },
  downloadRateLimitPerHour: { type: Number, default: 10 },
  maxDownloadsPerLead: { type: Number, default: 3 },
  updatedAt: { type: String, required: true },
});

siteSchema.index({ publicUrl: 1 }, {
  unique: true,
  partialFilterExpression: { publicUrl: { $ne: "" } },
});

export const Site = mongoose.models.Site ?? mongoose.model<ISite>("Site", siteSchema);

// --- Whitepaper ---
export interface IWhitepaper extends Document {
  numericId: number;
  siteId: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  parentCategory?: string;
  publisher: string;
  readingMinutes: number;
  publishedLabel: string;
  accent: string;
  issue: string;
  abstract: string;
  takeaways: string[];
  status: string;
  editorialStatus: string;
  updatedAt: string;
  subtitle: string;
  authorName: string;
  authorTitle: string;
  documentType: string;
  language: string;
  publicationDate: string;
  industry: string;
  targetAudience: string;
  geographicTarget: string;
  tags: string[];
  sourceName: string;
  sourceUrl: string;
  sourceDocumentUrl: string;
  sourceDocumentAsset: string;
  downloadablePdfAsset: string;
  sourceDocumentTitle: string;
  sourceRightsStatus: string;
  sourceRightsEvidence: string;
  scheduledAt: string;
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
  htmlContent: string;
}

const whitepaperSchema = new Schema<IWhitepaper>({
  numericId: { type: Number, required: true, unique: true },
  siteId: { type: Number, required: true, default: 1 },
  slug: { type: String, required: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  category: { type: String, required: true },
  parentCategory: { type: String, default: "" },
  publisher: { type: String, required: true },
  readingMinutes: { type: Number, required: true },
  publishedLabel: { type: String, required: true },
  accent: { type: String, required: true, enum: ["mint", "blue", "amber", "violet"] },
  issue: { type: String, required: true },
  abstract: { type: String, required: true },
  takeaways: { type: [String], required: true },
  status: { type: String, required: true, enum: ["draft", "published", "archived"] },
  editorialStatus: { type: String, default: "draft", enum: ["draft", "in_review", "approved", "changes_requested"] },
  updatedAt: { type: String, required: true },
  subtitle: { type: String, default: "" },
  authorName: { type: String, default: "Signal Research Desk" },
  authorTitle: { type: String, default: "" },
  documentType: { type: String, default: "whitepaper", enum: ["whitepaper", "research_report", "case_study", "guide", "briefing"] },
  language: { type: String, default: "en" },
  publicationDate: { type: String, default: "" },
  industry: { type: String, default: "" },
  targetAudience: { type: String, default: "" },
  geographicTarget: { type: String, default: "" },
  tags: { type: [String], default: [] },
  sourceName: { type: String, default: "" },
  sourceUrl: { type: String, default: "" },
  sourceDocumentUrl: { type: String, default: "" },
  sourceDocumentAsset: { type: String, default: "" },
  downloadablePdfAsset: { type: String, default: "" },
  sourceDocumentTitle: { type: String, default: "" },
  sourceRightsStatus: { type: String, default: "unknown", enum: ["unknown", "allowed", "review_required", "blocked", "expired"] },
  sourceRightsEvidence: { type: String, default: "" },
  scheduledAt: { type: String, default: "" },
  seoTitle: { type: String, default: "" },
  seoDescription: { type: String, default: "" },
  canonicalUrl: { type: String, default: "" },
  seoKeywords: { type: [String], default: [] },
  geoSummary: { type: String, default: "" },
  keyEntities: { type: [String], default: [] },
  keyFacts: { type: [String], default: [] },
  faqItems: { type: [{ question: String, answer: String }], default: [] },
  coverImageUrl: { type: String, default: "" },
  coverImageAlt: { type: String, default: "" },
  featured: { type: Boolean, default: false },
  htmlContent: { type: String, default: "" },
});

whitepaperSchema.index({ siteId: 1, slug: 1 }, { unique: true });
whitepaperSchema.index({ siteId: 1, status: 1, issue: 1 });

export const Whitepaper = mongoose.models.Whitepaper ?? mongoose.model<IWhitepaper>("Whitepaper", whitepaperSchema);

// --- Source Document ---
export interface IProvenanceEntry {
  action: string; // "uploaded", "scanned", "extracted", "encrypted", "generated"
  actor: string; // username
  timestamp: string; // ISO date
  detail: string; // action details/result
}

export interface ISourceDocument extends Document {
  numericId: number;
  title: string;
  originalFilename: string;
  sourceUrl: string;
  sourceAsset: string;
  rightsStatus: string;
  rightsEvidence: string;
  scheduledAt: string;
  targetSiteSlugs: string[];
  status: string;
  error: string;
  generatedPaperIds: number[];
  malwareScanResult?: string; // "clean", "infected", "error", "skipped"
  encryptionEnabled: boolean;
  provenanceLog: IProvenanceEntry[];
  createdAt: string;
  updatedAt: string;
}

const sourceDocumentSchema = new Schema<ISourceDocument>({
  numericId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  originalFilename: { type: String, default: "" },
  sourceUrl: { type: String, default: "" },
  sourceAsset: { type: String, default: "" },
  rightsStatus: { type: String, default: "unknown" },
  rightsEvidence: { type: String, default: "" },
  scheduledAt: { type: String, default: "" },
  targetSiteSlugs: { type: [String], default: [] },
  status: { type: String, default: "ready", enum: ["ready", "scheduled", "processing", "generated", "failed"] },
  error: { type: String, default: "" },
  generatedPaperIds: { type: [Number], default: [] },
  malwareScanResult: { type: String, default: "skipped", enum: ["clean", "infected", "error", "skipped"] },
  encryptionEnabled: { type: Boolean, default: false },
  provenanceLog: {
    type: [
      {
        action: { type: String, required: true },
        actor: { type: String, required: true },
        timestamp: { type: String, required: true },
        detail: { type: String, default: "" },
      },
    ],
    default: [],
  },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

export const SourceDocument = mongoose.models.SourceDocument ?? mongoose.model<ISourceDocument>("SourceDocument", sourceDocumentSchema);

// --- Editorial Review Event ---
export interface IEditorialReviewEvent extends Document {
  numericId: number;
  paperId: number;
  siteId: number;
  action: string;
  actor: string;
  note: string;
  occurredAt: string;
}

const editorialReviewEventSchema = new Schema<IEditorialReviewEvent>({
  numericId: { type: Number, required: true, unique: true },
  paperId: { type: Number, required: true },
  siteId: { type: Number, required: true },
  action: { type: String, required: true, enum: ["submitted", "approved", "changes_requested"] },
  actor: { type: String, required: true },
  note: { type: String, default: "" },
  occurredAt: { type: String, required: true },
});

editorialReviewEventSchema.index({ paperId: 1 });

export const EditorialReviewEvent = mongoose.models.EditorialReviewEvent ?? mongoose.model<IEditorialReviewEvent>("EditorialReviewEvent", editorialReviewEventSchema);

// --- Audit Event ---
export interface IAuditEvent extends Document {
  numericId: number;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  occurredAt: string;
  correlationId: string;
  detail: string;
}

const auditEventSchema = new Schema<IAuditEvent>({
  numericId: { type: Number, required: true, unique: true },
  actor: { type: String, required: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String, required: true },
  occurredAt: { type: String, required: true },
  correlationId: { type: String, default: "" },
  detail: { type: String, default: "" },
});

export const AuditEvent = mongoose.models.AuditEvent ?? mongoose.model<IAuditEvent>("AuditEvent", auditEventSchema);

// --- User ---
export interface IDomainRole {
  siteId: number;
  role: "admin" | "editor" | "reviewer";
}

export interface IUser extends Document {
  numericId: number;
  username: string;
  passwordHash: string;
  mfaSecret?: string;
  domainRoles: IDomainRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const userSchema = new Schema<IUser>({
  numericId: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  mfaSecret: { type: String, default: "" },
  domainRoles: {
    type: [
      {
        siteId: { type: Number, required: true },
        role: { type: String, required: true, enum: ["admin", "editor", "reviewer"] },
      },
    ],
    default: [],
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

userSchema.index({ username: 1 });

export const User = mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);

// --- Publishing Job Queue ---
export interface IPublishingJob extends Document {
  numericId: number;
  paperId: number;
  siteId: number;
  status: string; // "pending" | "processing" | "completed" | "failed"
  scheduledFor: string; // ISO timestamp
  attemptCount: number;
  lastError?: string;
  idempotencyKey: string; // UUID for deduplication
  createdAt: string;
  updatedAt: string;
}

const publishingJobSchema = new Schema<IPublishingJob>({
  numericId: { type: Number, required: true, unique: true },
  paperId: { type: Number, required: true },
  siteId: { type: Number, required: true },
  status: { type: String, required: true, default: "pending", enum: ["pending", "processing", "completed", "failed"] },
  scheduledFor: { type: String, required: true },
  attemptCount: { type: Number, default: 0 },
  lastError: { type: String, default: "" },
  idempotencyKey: { type: String, required: true, unique: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

publishingJobSchema.index({ siteId: 1, status: 1, scheduledFor: 1 });
publishingJobSchema.index({ paperId: 1 }, { unique: true });

export const PublishingJob = mongoose.models.PublishingJob ?? mongoose.model<IPublishingJob>("PublishingJob", publishingJobSchema);

// --- Content Revision ---
export interface IContentRevision extends Document {
  numericId: number;
  paperId: number;
  siteId: number;
  actor: string; // username
  action: string; // "created" | "edited" | "submitted" | "approved" | "rejected"
  snapshot: Record<string, any>; // Deep copy of whitepaper at this revision
  note: string; // reviewer feedback
  occurredAt: string;
}

const contentRevisionSchema = new Schema<IContentRevision>({
  numericId: { type: Number, required: true, unique: true },
  paperId: { type: Number, required: true },
  siteId: { type: Number, required: true },
  actor: { type: String, required: true },
  action: { type: String, required: true, enum: ["created", "edited", "submitted", "approved", "rejected"] },
  snapshot: { type: Schema.Types.Mixed, required: true },
  note: { type: String, default: "" },
  occurredAt: { type: String, required: true },
});

contentRevisionSchema.index({ paperId: 1, occurredAt: 1 });

export const ContentRevision = mongoose.models.ContentRevision ?? mongoose.model<IContentRevision>("ContentRevision", contentRevisionSchema);

// --- Reader Lead ---
export interface IReaderLead extends Document {
  numericId: number;
  siteId: number;
  paperId: number;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  verificationToken: string; // Random token for one-time email verification
  verificationTokenExpires: string; // ISO timestamp
  isVerified: boolean;
  consentStatus: string; // "pending" | "accepted" | "declined"
  consentAcceptedAt?: string; // ISO timestamp when consent accepted
  marketingConsent: boolean;
  downloadCount: number;
  lastDownloadAt?: string;
  createdAt: string;
  updatedAt: string;
}

const readerLeadSchema = new Schema<IReaderLead>({
  numericId: { type: Number, required: true, unique: true },
  siteId: { type: Number, required: true },
  paperId: { type: Number, required: true },
  email: { type: String, required: true, lowercase: true },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  company: { type: String, default: "" },
  verificationToken: { type: String, required: true },
  verificationTokenExpires: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  consentStatus: { type: String, default: "pending", enum: ["pending", "accepted", "declined"] },
  consentAcceptedAt: { type: String, default: "" },
  marketingConsent: { type: Boolean, default: false },
  downloadCount: { type: Number, default: 0 },
  lastDownloadAt: { type: String, default: "" },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

readerLeadSchema.index({ siteId: 1, paperId: 1, email: 1 }, { unique: true });
readerLeadSchema.index({ verificationToken: 1 });
readerLeadSchema.index({ siteId: 1, isVerified: 1, consentStatus: 1 });

export const ReaderLead = mongoose.models.ReaderLead ?? mongoose.model<IReaderLead>("ReaderLead", readerLeadSchema);

// --- Consent Log ---
export interface IConsentLog extends Document {
  numericId: number;
  leadId: number;
  siteId: number;
  action: string; // "requested" | "verified" | "accepted" | "declined" | "withdrawn"
  userAgent: string;
  ipAddress: string;
  occurredAt: string;
}

const consentLogSchema = new Schema<IConsentLog>({
  numericId: { type: Number, required: true, unique: true },
  leadId: { type: Number, required: true },
  siteId: { type: Number, required: true },
  action: { type: String, required: true, enum: ["requested", "verified", "accepted", "declined", "withdrawn"] },
  userAgent: { type: String, default: "" },
  ipAddress: { type: String, required: true },
  occurredAt: { type: String, required: true },
});

consentLogSchema.index({ leadId: 1, occurredAt: 1 });
consentLogSchema.index({ siteId: 1, action: 1 });

export const ConsentLog = mongoose.models.ConsentLog ?? mongoose.model<IConsentLog>("ConsentLog", consentLogSchema);
