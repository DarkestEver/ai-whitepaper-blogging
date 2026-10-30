# Centralized Multi-Site Publishing Platform
# Technical Specification

**Status:** Technical baseline for engineering review; production use is approval-gated  
**Version:** 1.0  
**Purpose:** Define implementation-level contracts, schemas, API behavior, state transitions, security controls, and verification requirements.

> This specification is a technical baseline, not authorization to make unresolved business, legal, or production decisions. Items marked **Decision required** must be confirmed before the affected behavior is enabled. The first release must use one authoritative publisher per domain and one AI provider for the initial vertical slice.

For what is actually implemented in this workspace and what remains pending, see [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md).

---

## 1. Scope and non-goals

### In scope

- Site configuration and hostname resolution
- Admin authentication and server-side site authorization
- Source PDF intake, rights tracking, extraction metadata, and evidence references
- Structured AI draft generation behind a provider adapter
- Deterministic publishing quality gates
- Versioned article revisions and idempotent publishing jobs
- Public rendering of published content
- Email verification and short-lived whitepaper download authorization
- Audit events, operational telemetry, retention, and migration boundaries
- Consent-based reader email subscriptions and unsubscribe/suppression lifecycle
- A future paid-plan catalog and billing-provider boundary, gated on business decisions

### Explicitly out of scope for the first vertical slice

- Multiple AI providers in production
- Arbitrary executable theme templates
- Automatic publication of sources with unknown or restricted rights
- Production WordPress cutover
- Payment processing and production customer billing in the first vertical slice
- Reader newsletter/marketing subscriptions in the first vertical slice
- Vendor-facing whitepaper marketplace, paid syndication campaigns, or lead delivery
- Arbitrary user-generated HTML or scripts

---

## 2. System context and module boundaries

### Current prototype configuration boundary

The local prototype supports multiple site records with validated `public_url` origins, site-specific content records, public resolution by the incoming `Host` header, fail-closed handling for unregistered hosts, and site identity in AI drafting context. The domain owner is responsible for DNS-to-host mapping; the app does not configure DNS or TLS. This implementation is not a production tenancy boundary: approved identity/RBAC, trusted-proxy configuration, admin authorization by site, durable storage, cache/CDN isolation, domain ownership verification, and staging validation remain production requirements.

Use a TypeScript modular monolith with independently runnable workers. Keep module APIs explicit so workers or modules can be separated later without coupling domain logic to infrastructure.

```text
apps/
  admin/                 Admin UI
  public/                Multi-domain public renderer
  api/                   Versioned HTTP API and composition root
  worker/                Queue consumers
packages/
  contracts/             Shared request/response/job schemas
  domain/                Business entities and policies
  database/              Mongo repositories, indexes, migrations
  auth/                  Identity and authorization
  site-config/           Host resolution and site configuration
  ingestion/             Source intake and extraction orchestration
  evidence/              Evidence references and claim validation
  ai/                    Provider interface and selected adapter
  quality/               Deterministic publish gates
  publishing/            Jobs, adapters, reconciliation
  downloads/             Lead verification and download grants
  storage/               Private object storage abstraction
  observability/          Logging, metrics, tracing
services/
  pdf-worker/             Restricted PDF parsing/OCR process
```

### Dependency direction

- `contracts` depends only on schema/runtime libraries.
- `domain` depends on contracts and pure utilities.
- Feature modules depend on domain ports, not concrete infrastructure.
- API and workers compose domain services with MongoDB, Redis, storage, mail, and provider adapters.
- Public rendering reads only published projections; it must not access admin-only repositories or secret stores.

### Recommended application ports

```ts
export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  newId(): string;
}

export interface ObjectStorage {
  put(input: {
    key: string;
    body: NodeJS.ReadableStream;
    contentType: string;
    checksumSha256: string;
    metadata: Record<string, string>;
  }): Promise<{ key: string; etag?: string }>;
  get(key: string): Promise<NodeJS.ReadableStream>;
  delete(key: string): Promise<void>;
}

export interface SecretProvider {
  get(reference: string): Promise<string>;
}
```

---

## 3. Cross-cutting conventions

### 3.1 Identifiers and time

- Use opaque string IDs at API boundaries.
- Persist timestamps as UTC BSON dates.
- API timestamps are ISO 8601 UTC strings.
- Generate correlation IDs at ingress if the caller did not supply a valid one.
- Never use client-provided IDs as authorization evidence.

### 3.2 Site scope

For admin operations, derive permitted `siteId` values from the authenticated principal. A body or query `siteId` is a requested scope only; authorize it before repository access.

For public requests, resolve the normalized `Host` through the active site registry. Reject unknown, paused, malformed, or ambiguous hosts. Do not trust `X-Forwarded-Host` unless it is set by a configured trusted proxy.

Every site-owned repository method must require a `siteId` argument:

```ts
interface SiteScopedRepository<T> {
  findById(siteId: string, id: string): Promise<T | null>;
  list(siteId: string, query: PageQuery): Promise<Page<T>>;
}
```

Avoid unscoped methods such as `findById(id)` for site-owned entities.

### 3.3 Error response

All API errors use a stable envelope:

```ts
export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId: string;
    correlationId: string;
    details?: Array<{ field?: string; issue: string }>;
  };
}
```

Do not return stack traces, secret references, provider credentials, or internal network details.

### 3.4 Pagination

List endpoints use cursor pagination:

```ts
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

Limit maximum page size to 100. Cursor contents must be opaque and validated.

---

## 4. Runtime configuration

Use validated configuration at process startup. Do not silently substitute production-critical defaults.

```ts
import { z } from "zod";

export const AppConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().min(1).max(65535),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  OBJECT_STORAGE_ENDPOINT: z.string().url(),
  OBJECT_STORAGE_BUCKET: z.string().min(1),
  OBJECT_STORAGE_SECRET_REF: z.string().min(1),
  SESSION_SECRET_REF: z.string().min(1),
  PUBLIC_BASE_URL: z.string().url(),
  TRUSTED_PROXY_CIDRS: z.array(z.string()).default([]),
  PDF_MAX_BYTES: z.coerce.number().int().positive(),
  PDF_MAX_PAGES: z.coerce.number().int().positive(),
  PDF_PROCESS_TIMEOUT_MS: z.coerce.number().int().positive(),
  DOWNLOAD_TOKEN_TTL_SECONDS: z.coerce.number().int().positive(),
  AI_PROVIDER: z.string().min(1),
  AI_MODEL_ID: z.string().min(1),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  return AppConfigSchema.parse(env);
}
```

Production deployment must provide secret references, not secret values in checked-in files. Validate the resulting environment on startup and terminate with a clear configuration error when required values are missing.

---

## 5. Domain schemas

Schemas below are authoritative API/domain shapes for v1. Persistence documents may include internal fields such as `_id`, `createdAt`, and `updatedAt`; API DTOs must not expose storage internals.

### 5.1 Shared primitives

```ts
import { z } from "zod";

export const IdSchema = z.string().min(1).max(128);
export const IsoDateSchema = z.string().datetime({ offset: true });
export const SlugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const RightsStatusSchema = z.enum([
  "unknown",
  "allowed",
  "review_required",
  "blocked",
  "expired",
]);

export const SiteStatusSchema = z.enum(["draft", "active", "paused", "archived"]);
```

### 5.2 Site configuration

```ts
export const SiteConfigSchema = z.object({
  slug: SlugSchema,
  status: SiteStatusSchema,
  domains: z.array(z.string().min(1)).min(1),
  brand: z.object({
    name: z.string().min(1).max(120),
    logoAssetId: IdSchema.optional(),
    language: z.string().min(2).max(35),
    timezone: z.string().min(1),
  }),
  theme: z.object({
    presetId: z.string().regex(/^[a-z][a-z0-9-]{2,100}$/),
    version: z.string().min(1),
    tokens: z.record(z.string(), z.string()),
  }),
  editorialProfile: z.object({
    audience: z.string().min(1).max(500),
    voice: z.string().min(1).max(500),
    allowedCategories: z.array(SlugSchema),
    defaultAuthorId: IdSchema.optional(),
  }),
  seoPolicy: z.object({
    defaultTitleSuffix: z.string().max(120).optional(),
    defaultRobots: z.enum(["index,follow", "noindex,nofollow"]),
    canonicalOrigin: z.string().url(),
  }),
  publishingPolicy: z.object({
    autoPublishEnabled: z.boolean(),
    requireHumanApproval: z.boolean(),
    qualityPolicyVersion: z.string().min(1),
  }),
  killSwitches: z.object({
    ingestionPaused: z.boolean(),
    generationPaused: z.boolean(),
    publishingPaused: z.boolean(),
  }),
});

export type SiteConfigInput = z.infer<typeof SiteConfigSchema>;
```

`presetId` is validated at runtime against the code-owned registry defined in [FRONTEND_THEME_AND_INTEGRATION_SPEC.md](./FRONTEND_THEME_AND_INTEGRATION_SPEC.md). Do not constrain it to a short hardcoded enum in the shared request schema; the registry is expected to contain at least 36 preset definitions. The server must reject an unknown, deprecated-for-new-assignment, or incompatible preset with a stable validation error. Only presets that have completed the approved lifecycle may be assigned to production sites.

#### Site invariants

- Normalize domains to lower-case IDNA ASCII hostnames before uniqueness checks.
- Reject URL schemes, paths, credentials, ports outside explicitly approved configuration, wildcard hosts, and public suffix-only domains.
- A hostname may resolve to no more than one active site.
- `paused` site blocks ingestion, generation, and publishing regardless of individual feature switches.
- Theme preset must be in the code-defined registry; DB values cannot supply executable templates.
- Auto-publish requires `rightsStatus === "allowed"` and every required quality gate to pass.

### 5.3 Source and evidence

```ts
export const SourceDocumentSchema = z.object({
  siteId: IdSchema,
  kind: z.enum(["pdf_upload", "pdf_url"]),
  title: z.string().max(500).optional(),
  sourceUrl: z.string().url().optional(),
  publisher: z.string().max(300).optional(),
  publishedAt: IsoDateSchema.optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  assetKey: z.string().min(1),
  rightsStatus: RightsStatusSchema,
  rightsEvidence: z.string().max(4000).optional(),
  extractionStatus: z.enum(["queued", "processing", "complete", "failed", "quarantined"]),
  language: z.string().max(35).optional(),
  pageCount: z.number().int().positive().optional(),
});

export const EvidenceChunkSchema = z.object({
  siteId: IdSchema,
  sourceId: IdSchema,
  pageNumber: z.number().int().positive(),
  sectionHeading: z.string().max(500).optional(),
  textAssetKey: z.string().min(1),
  textSha256: z.string().regex(/^[a-f0-9]{64}$/),
  extractionMethod: z.enum(["pdf_text", "ocr", "manual"]),
  confidence: z.number().min(0).max(1),
});

export const ClaimEvidenceSchema = z.object({
  claimId: IdSchema,
  claimText: z.string().min(1).max(3000),
  claimType: z.enum(["fact", "statistic", "quote", "technical", "analysis"]),
  evidence: z.array(
    z.object({
      sourceId: IdSchema,
      chunkId: IdSchema,
      pageNumber: z.number().int().positive(),
      quoteHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    }),
  ),
  status: z.enum(["supported", "unsupported", "conflict", "needs_review"]),
  verifierVersion: z.string().min(1),
});
```

The application stores extracted text in private object storage. MongoDB holds hashes, page metadata, source links, and object keys. Do not make source documents publicly readable by default.

### 5.4 Article content and revisions

Use constrained rich-text blocks. Do not accept arbitrary HTML from the model.

```ts
export const ArticleBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string().min(1).max(12000) }),
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), text: z.string().min(1).max(300) }),
  z.object({ type: z.literal("quote"), text: z.string().min(1).max(3000), citationId: IdSchema }),
  z.object({ type: z.literal("list"), ordered: z.boolean(), items: z.array(z.string().min(1).max(2000)).min(1).max(100) }),
  z.object({ type: z.literal("image"), assetId: IdSchema, alt: z.string().min(1).max(500), caption: z.string().max(1000).optional() }),
]);

export const ArticleDraftSchema = z.object({
  title: z.string().min(1).max(200),
  slug: SlugSchema,
  summary: z.string().min(1).max(500),
  blocks: z.array(ArticleBlockSchema).min(1).max(250),
  seo: z.object({
    title: z.string().min(1).max(70),
    description: z.string().min(1).max(180),
    canonicalPath: z.string().startsWith("/"),
    robots: z.enum(["index,follow", "noindex,nofollow"]),
  }),
  sourceIds: z.array(IdSchema).min(1),
  citations: z.array(
    z.object({
      citationId: IdSchema,
      sourceId: IdSchema,
      displayText: z.string().min(1).max(500),
      pageNumber: z.number().int().positive().optional(),
      targetUrl: z.string().url().optional(),
      accessedAt: IsoDateSchema.optional(),
    }),
  ),
  claims: z.array(ClaimEvidenceSchema),
  uncertaintyFlags: z.array(z.string().max(500)),
});

export const ArticleStatusSchema = z.enum([
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "blocked",
  "archived",
]);
```

#### Local prototype content fields (implemented subset)

The local SQLite prototype currently adds validated editorial fields for subtitle, author and role, document type, language, publication date, industry, audience, geographic target, tags, source attribution, featured status, and a cover-image asset/alt text. Its discovery fields include SEO title, description, keywords, optional absolute HTTP(S) canonical URL, GEO answer summary, named entities, facts, and structured FAQ question/answer pairs. Public rendering maps these into visible page sections, Open Graph/Twitter tags, and Article/FAQPage JSON-LD. The prototype remains `noindex,nofollow`; a canonical URL does not enable indexing.

The public prototype catalog supports URL-driven search, topic filtering, and dynamic pagination at six matching records per page. The page number is clamped to the available result range, and pagination links preserve active search/topic filters. This prototype currently loads and filters the local catalog before slicing; production APIs should use the cursor-pagination contract defined above.

This local form and SQLite record are not a substitute for the production `ArticleDraftSchema`: immutable revisions, constrained rich-text blocks, evidence/citation links, source rights, review status, and site scoping are still required. Prototype images are restricted to JPEG/PNG/WebP, limited to 5 MB, checked against file signatures, and stored locally under `.data/media`. Do not use this local upload path in production; select private object storage, malware scanning, image processing, retention, and access policies before enabling real assets.

The local prototype's Admin → PDF library accepts batches of up to 20 uploaded PDFs and/or HTTP(S) source URLs. Every item must be assigned its own future schedule date and time during intake; calendar dates must be distinct across the source library, not only within one batch. Each source's target-site list, rights fields, and schedule remain editable. External URLs are references only and are never fetched. Uploaded PDFs (up to 20 MB each, 100 MB batch total) are checked for a `%PDF-` signature, stored under ignored `.data/sources`, and served as an attachment through an authenticated, no-store admin route. PDF.js extracts embedded text for up to 200 pages/110,000 characters; scanned-page OCR, malware scanning, and rights verification are not implemented.

Optional server-side `AI_PROVIDER` adapters support OpenAI, Anthropic, and Google Gemini text generation. Extracted PDF text is sent to the configured vendor. Structured output must contain metadata, SEO/GEO, FAQs, and page-cited facts; citations are checked for format and page-number range, not semantically verified. One reviewable draft is created per selected site. AI image covers are generated only when an OpenAI image API key is configured; otherwise drafts have no cover image. AI never auto-publishes. Provider/model output can still be inaccurate, so editorial review is required. This workflow is a local prototype; the site registry currently contains only the demo site and does not represent real domains.

Publishing/scheduling an actual content record requires an explicit `allowed` rights status plus at least 20 characters of human-entered rights evidence. This length/status check is a prototype form-level safeguard, not verification that rights exist or that the evidence is truthful or sufficient. Each distinct source schedule is editorial intent only; generated records stay drafts and must be reviewed and scheduled individually.

Local scheduled content is stored as a draft plus an ISO-8601 `scheduledAt` value, so it is not public before its due time. Due records are promoted atomically with a local audit event when catalog/detail/admin content reads run, only while the rights gate remains cleared. This request-triggered behavior is for demonstrating the workflow, not a timing guarantee. Production scheduling requires an independently operated durable queue/worker or approved scheduler with idempotency, retries, observability, and approval policies.

Every edit creates an immutable revision with an increasing integer version. The current article record points to the active revision. Published revisions remain reproducible and auditable.

### 5.5 AI generation records

```ts
export const GenerationRecordSchema = z.object({
  provider: z.string().min(1),
  modelId: z.string().min(1),
  promptVersion: z.string().min(1),
  contractVersion: z.string().min(1),
  requestedAt: IsoDateSchema,
  completedAt: IsoDateSchema.optional(),
  outcome: z.enum(["succeeded", "failed", "held"]),
  inputSourceIds: z.array(IdSchema),
  outputRevisionId: IdSchema.optional(),
  usage: z.object({
    inputTokens: z.number().nonnegative().optional(),
    outputTokens: z.number().nonnegative().optional(),
    estimatedCostUsd: z.number().nonnegative().optional(),
  }).optional(),
  failureCode: z.string().optional(),
});
```

Do not persist raw provider credentials. Avoid storing full prompts or source excerpts in normal logs. If prompt/output retention is needed for debugging, define retention and access controls explicitly.

### 5.6 Lead and download authorization

```ts
export const DownloadRequestSchema = z.object({
  sourceId: IdSchema,
  email: z.string().email().max(320),
  consent: z.object({
    downloadTermsVersion: z.string().min(1),
  }),
});

export const DownloadRequestResultSchema = z.object({
  requestId: IdSchema,
  status: z.literal("verification_required"),
  message: z.string(),
});
```

The public response must not reveal whether an email already exists. Store a keyed hash of normalized email for lookup where possible; encrypt any email address that must be used for verification and apply the approved retention policy.

### 5.7 Reader email subscription and unsubscribe

Newsletter/marketing subscription is separate from a whitepaper download request and from any paid platform subscription. A download request, account creation, or acceptance of terms must never silently opt a person into marketing.

```ts
export const EmailSubscriptionRequestSchema = z.object({
  email: z.string().email().max(320),
  listId: SlugSchema,
  consent: z.object({
    purpose: z.literal("marketing_email"),
    wordingVersion: z.string().min(1),
    privacyNoticeVersion: z.string().min(1),
    accepted: z.literal(true),
  }),
});

export const EmailSubscriptionSchema = z.object({
  id: IdSchema,
  siteId: IdSchema,
  listId: SlugSchema,
  emailLookupHash: z.string().min(32),
  status: z.enum(["pending_confirmation", "active", "unsubscribed", "suppressed"]),
  consent: z.object({
    purpose: z.literal("marketing_email"),
    wordingVersion: z.string().min(1),
    privacyNoticeVersion: z.string().min(1),
    consentedAt: IsoDateSchema,
    confirmedAt: IsoDateSchema.optional(),
    source: z.enum(["public_form", "admin_import"]),
  }),
  unsubscribedAt: IsoDateSchema.optional(),
});
```

Rules:

- Use double opt-in by default: do not send marketing until the confirmation token is redeemed. A legal/privacy owner may approve another jurisdiction-specific model; record it in D-18 and its implementation evidence.
- Confirmation and unsubscribe links use high-entropy, purpose-bound, expiring tokens; persist only token hashes. Unsubscribe is one-click, login-free, idempotent, and must not require a survey or sign-in.
- Every marketing send checks current consent and suppression state immediately before dispatch. Unsubscribe suppresses future marketing promptly across the sending system; queued messages are canceled where possible.
- Keep transactional verification/download messages distinct from marketing lists and templates. A person may request a download without marketing consent.
- Retain only the minimum suppression identifier necessary to honor unsubscribe, according to the approved retention policy. Never log raw email, confirmation/unsubscribe tokens, or full request payloads.
- Admin imports require documented lawful basis, source, timestamp, and approver; imported addresses are not automatically treated as confirmed unless D-18 explicitly allows the method.

### 5.8 Paid plans, pricing, and billing boundary

Paid platform subscriptions are a future commercial capability, not part of the selected owned-multi-site-publisher scope or first vertical slice. Vendor-facing whitepaper marketplace, paid syndication campaigns, and lead delivery are also out of scope unless D-22 is formally approved. No price, currency, billing period, tax treatment, free trial, discount, refund, or service entitlement is approved by this specification. D-20 and D-21 must be approved before displaying sale terms or accepting payment.

The future implementation must expose a versioned, code-owned or administratively controlled plan catalog with immutable published price versions. A plan/price version must define currency, amount, billing interval, included entitlements/limits, tax display treatment, effective dates, and the applicable terms version. Existing customers must retain a traceable price/terms version; price changes must not silently mutate an accepted subscription. Do not store payment-card data; select a PCI-compliant billing provider after security, legal, tax, and procurement review.

Before production billing, implement explicit states for trial, active, past-due/grace, cancellation-at-period-end, canceled, and suspended; idempotent provider webhook handling; reconciliation; invoice/receipt references; access/entitlement enforcement; customer self-service cancellation; refunds/proration policy; and support/admin audit events. Terms and price disclosure must be visible before checkout and preserved as acceptance evidence. No billing provider, legal terms text, service guarantee, or monetary value may be inferred from example data.

The minimum platform boundary is a `PlanCatalog` that returns published/effective offerings, a `BillingProvider` port for checkout/customer portal/cancellation/webhook verification, and an `EntitlementService` that makes authorization decisions from persisted subscription state. UI visibility is never an entitlement check. Taxes and legal copy remain owned by approved configuration and jurisdiction-specific counsel.

```ts
export interface PublishedPlanPrice {
  planId: string;
  planVersion: string;
  priceVersion: string;
  currency: string;
  amountMinor: number;
  interval: "month" | "year";
  taxDisplay: "inclusive" | "exclusive" | "jurisdictional";
  entitlements: Record<string, string | number | boolean>;
  termsVersion: string;
  effectiveFrom: string;
  effectiveUntil?: string;
}

export interface CustomerSubscription {
  tenantId: string;
  providerSubscriptionRef: string;
  planId: string;
  priceVersion: string;
  termsVersion: string;
  status: "trial" | "active" | "past_due" | "cancel_at_period_end" | "canceled" | "suspended";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface TermsAcceptanceEvidence {
  customerId: string;
  termsVersion: string;
  priceVersion?: string;
  acceptedAt: string;
  locale: string;
  source: "checkout" | "terms_update";
}
```

Validate currency as an active ISO 4217 code and `amountMinor` as a non-negative safe integer at runtime. This is a contract outline, not a decision on commercial terms or tenant architecture. Store only provider references and required billing metadata; payment instrument data stays with the approved payment provider.

---

## 6. State machines and invariants

### 6.1 Source lifecycle

```text
received -> validating -> queued -> extracting -> extracted
    |          |             |          |
    +----------+-------------+----------+-> quarantined
                                      \----> failed
```

Rules:

- Only validated sources may enter extraction.
- Quarantined sources cannot be used for generation.
- Failed sources may be retried by an authorized operator after the cause is reviewed.
- Rights status is independent of extraction status.
- Unknown, review-required, blocked, or expired rights cannot auto-publish.

### 6.2 Article lifecycle

```text
draft -> in_review -> approved -> scheduled -> publishing -> published
  |          |          |           |              |
  +----------+----------+-----------+--------------+-> blocked
published -> archived
```

Only the quality service may set a revision to publish-eligible. Human approval does not override a hard failure such as blocked rights, invalid citation references, or unsupported high-impact claims.

### 6.3 Publishing job lifecycle

```text
queued -> running -> succeeded
             |          |
             +-> retry_wait -> running
             +-> failed
             +-> reconciliation_required -> reconciled
```

Rules:

- A unique idempotency key identifies a site, article revision, and destination operation.
- A queue retry reuses the original idempotency key.
- A worker lease prevents simultaneous processing of the same job.
- After uncertain remote outcome, reconcile before issuing another create operation.
- `succeeded` requires destination verification, not merely a successful HTTP response from the initial request.

### 6.4 Download authorization lifecycle

```text
request_received -> verification_pending -> verified -> token_issued
                                               token_issued -> redeemed
                                               token_issued -> expired
                                               token_issued -> revoked
```

Token redemption must be atomic: exactly one concurrent redemption can transition a valid token to `redeemed`.

---

## 7. MongoDB persistence specification

Collection names below are lowercase plural. Include `createdAt` and `updatedAt` where mutable; append-only records such as audit events and revisions should not be updated except for explicitly documented status metadata.

### 7.1 `sites`

Document fields:

```ts
interface SiteDocument {
  _id: string;
  slug: string;
  status: "draft" | "active" | "paused" | "archived";
  normalizedDomains: string[];
  config: SiteConfigInput;
  configVersion: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Indexes:

```js
db.sites.createIndex({ slug: 1 }, { unique: true });
db.sites.createIndex({ normalizedDomains: 1 }, { unique: true });
db.sites.createIndex({ status: 1 });
```

Domain uniqueness must be enforced during writes, including across array elements and aliases. Confirm MongoDB multikey unique-index semantics against the chosen schema; if necessary, use a separate `site_domains` collection with a unique normalized-domain index.

### 7.2 `site_domains`

```ts
interface SiteDomainDocument {
  _id: string;
  siteId: string;
  hostname: string;
  primary: boolean;
  status: "pending" | "active" | "disabled";
  createdAt: Date;
}
```

Indexes:

```js
db.site_domains.createIndex({ hostname: 1 }, { unique: true });
db.site_domains.createIndex({ siteId: 1, primary: 1 });
```

### 7.3 `sources`

Indexes:

```js
db.sources.createIndex({ siteId: 1, sha256: 1 }, { unique: true });
db.sources.createIndex({ siteId: 1, extractionStatus: 1, createdAt: -1 });
db.sources.createIndex({ siteId: 1, rightsStatus: 1 });
```

### 7.4 `evidence_chunks`

Indexes:

```js
db.evidence_chunks.createIndex({ siteId: 1, sourceId: 1, pageNumber: 1 });
db.evidence_chunks.createIndex({ siteId: 1, sourceId: 1, textSha256: 1 });
```

### 7.5 `articles` and `article_revisions`

```js
db.articles.createIndex({ siteId: 1, slug: 1 }, { unique: true });
db.articles.createIndex({ siteId: 1, status: 1, publishedAt: -1 });
db.articles.createIndex({ siteId: 1, sourceIds: 1 });
db.article_revisions.createIndex({ siteId: 1, articleId: 1, version: 1 }, { unique: true });
```

### 7.6 `publishing_jobs`

```js
db.publishing_jobs.createIndex({ idempotencyKey: 1 }, { unique: true });
db.publishing_jobs.createIndex({ status: 1, scheduledAt: 1 });
db.publishing_jobs.createIndex({ status: 1, leaseExpiresAt: 1 });
db.publishing_jobs.createIndex({ siteId: 1, articleId: 1, createdAt: -1 });
```

### 7.7 `leads`, `download_requests`, `download_tokens`

```js
db.leads.createIndex({ siteId: 1, emailLookupHash: 1 });
db.download_requests.createIndex({ siteId: 1, sourceId: 1, createdAt: -1 });
db.download_tokens.createIndex({ tokenHash: 1 }, { unique: true });
db.download_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.email_subscriptions.createIndex({ siteId: 1, listId: 1, emailLookupHash: 1 }, { unique: true });
db.email_subscriptions.createIndex({ siteId: 1, listId: 1, status: 1 });
db.email_subscription_tokens.createIndex({ tokenHash: 1 }, { unique: true });
db.email_subscription_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
db.email_suppressions.createIndex({ siteId: 1, listId: 1, emailLookupHash: 1 }, { unique: true });
db.customer_subscriptions.createIndex({ tenantId: 1, status: 1 });
db.billing_events.createIndex({ providerEventId: 1 }, { unique: true });
```

TTL indexes are cleanup aids only. Every token redemption must check `expiresAt` explicitly because TTL deletion is asynchronous.

### 7.8 `audit_events`

```js
db.audit_events.createIndex({ siteId: 1, createdAt: -1 });
db.audit_events.createIndex({ correlationId: 1 });
db.audit_events.createIndex({ actorId: 1, createdAt: -1 });
```

Audit events must not include raw tokens, passwords, provider credentials, complete emails, or source document contents.

---

## 8. API specification

Base path: `/api/v1`. All requests and responses use JSON except streaming upload/download routes. All endpoints require HTTPS in non-local environments.

### 8.1 Authentication and authorization

The exact identity provider is **Decision required**. Implement an `AuthContext` abstraction so identity verification is not tied to a specific vendor.

```ts
export interface AuthContext {
  actorId: string;
  actorType: "user" | "service";
  roles: string[];
  permittedSiteIds: string[];
  requestId: string;
  correlationId: string;
}
```

Admin authorization must check both role/action and site membership. Service identities receive narrow capabilities and cannot use browser sessions.

### 8.2 Create site

`POST /api/v1/admin/sites`

Request:

```json
{
  "slug": "research-briefs",
  "status": "draft",
  "domains": ["briefs.example.test"],
  "brand": {
    "name": "Research Briefs",
    "language": "en",
    "timezone": "UTC"
  },
  "theme": {
    "presetId": "research-library",
    "version": "1",
    "tokens": {
      "color.primary": "#174a70"
    }
  },
  "editorialProfile": {
    "audience": "Technology decision makers",
    "voice": "Clear, evidence-led",
    "allowedCategories": ["research"]
  },
  "seoPolicy": {
    "defaultRobots": "noindex,nofollow",
    "canonicalOrigin": "https://briefs.example.test"
  },
  "publishingPolicy": {
    "autoPublishEnabled": false,
    "requireHumanApproval": true,
    "qualityPolicyVersion": "1"
  },
  "killSwitches": {
    "ingestionPaused": false,
    "generationPaused": false,
    "publishingPaused": true
  }
}
```

Response `201 Created`:

```json
{
  "data": {
    "id": "site_01",
    "slug": "research-briefs",
    "status": "draft",
    "configVersion": 1
  },
  "requestId": "req_01",
  "correlationId": "corr_01"
}
```

Validation:

- Require `sites:create` permission.
- Normalize/validate all hostnames.
- Reject duplicate slug or hostname with `409 SITE_CONFLICT`.
- New sites default to non-publishing state.
- Emit audit event with changed field names, not secret values.

### 8.3 Upload source

`POST /api/v1/admin/sites/{siteId}/sources`  
Content type: `multipart/form-data`

Fields:

- `file`: required PDF
- `rightsStatus`: required enum
- `rightsEvidence`: optional text
- `title`: optional

Response `202 Accepted`:

```json
{
  "data": {
    "sourceId": "src_01",
    "status": "queued",
    "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "jobId": "job_01"
  },
  "requestId": "req_02",
  "correlationId": "corr_01"
}
```

Rules:

- Enforce byte limit before storing.
- Validate PDF signature and parseability in isolated worker.
- Calculate SHA-256 server-side.
- Store original in private storage.
- Deduplicate by `(siteId, sha256)` unless an approved policy says source identity is global.
- `unknown`, `review_required`, `blocked`, or `expired` rights states may be ingested for review but may not be auto-published.

### 8.4 Process an approved PDF URL

`POST /api/v1/admin/sites/{siteId}/sources/url`

Request:

```json
{
  "url": "https://publisher.example.test/report.pdf",
  "rightsStatus": "allowed",
  "rightsEvidence": "License record reference"
}
```

Rules:

- Only `https` URLs are accepted.
- Validate each resolved address and each redirect hop.
- Block loopback, private, link-local, multicast, reserved, and cloud metadata ranges.
- Apply outbound network restrictions at infrastructure level as well as application validation.
- Do not allow redirects to a new host unless it independently passes policy.
- Record sanitized source URL; remove credentials and sensitive query parameters from logs.

### 8.5 Get source and evidence

- `GET /api/v1/admin/sites/{siteId}/sources/{sourceId}`
- `GET /api/v1/admin/sites/{siteId}/sources/{sourceId}/evidence?cursor=...`

Both require scoped read permission. Evidence text may be returned only to authorized users and should be bounded/paginated.

### 8.6 Generate draft

`POST /api/v1/admin/sites/{siteId}/articles/drafts`

Request:

```json
{
  "sourceIds": ["src_01"],
  "format": "article",
  "language": "en",
  "promptVersion": "article-draft-v1"
}
```

Response `202 Accepted`:

```json
{
  "data": {
    "articleId": "art_01",
    "generationId": "gen_01",
    "status": "drafting"
  },
  "requestId": "req_03",
  "correlationId": "corr_01"
}
```

Rules:

- Check site generation kill switch.
- Check every source belongs to the requested site and is extractable.
- Send evidence references and bounded source text to provider; never send credentials or unrelated site data.
- Validate provider response against `ArticleDraftSchema`.
- If validation fails, mark generation failed and do not create a publishable article.
- Record provider, model, prompt and contract versions.

### 8.7 Get article and quality report

- `GET /api/v1/admin/sites/{siteId}/articles/{articleId}`
- `GET /api/v1/admin/sites/{siteId}/articles/{articleId}/quality`

Quality response:

```json
{
  "data": {
    "articleId": "art_01",
    "revision": 3,
    "eligibleToPublish": false,
    "policyVersion": "1",
    "checks": [
      { "code": "RIGHTS_ALLOWED", "status": "pass" },
      { "code": "CLAIMS_SUPPORTED", "status": "fail", "details": ["claim_04"] },
      { "code": "CITATIONS_RESOLVE", "status": "pass" },
      { "code": "SEO_VALID", "status": "pass" }
    ]
  },
  "requestId": "req_04",
  "correlationId": "corr_01"
}
```

### 8.8 Publish article

`POST /api/v1/admin/sites/{siteId}/articles/{articleId}/publish`

Request:

```json
{
  "revision": 3,
  "idempotencyKey": "publish:site_01:art_01:rev_3:destination_01",
  "destination": "staging"
}
```

Response `202 Accepted`:

```json
{
  "data": {
    "jobId": "pub_01",
    "status": "queued",
    "idempotencyKey": "publish:site_01:art_01:rev_3:destination_01"
  },
  "requestId": "req_05",
  "correlationId": "corr_01"
}
```

Rules:

- Require publisher permission.
- Require site publishing kill switch to be off.
- Recompute quality gates immediately before enqueue and again before destination side effects.
- Reject hard failures with `422 QUALITY_GATE_FAILED`.
- Enforce unique idempotency key.
- Production destination must be disabled until publishing authority and cutover approval are resolved.

### 8.9 Public article read

- `GET /api/v1/public/articles`
- `GET /api/v1/public/articles/{slug}`

Resolve site from trusted hostname. Return only `published` content whose canonical/robots policies permit public access. Never allow a caller to choose another site by query parameter.

### 8.10 Request download and verify email

`POST /api/v1/public/download-requests`

Accept `DownloadRequestSchema`. Always return a response that does not reveal whether the email is already known. Apply per-IP and per-email-hash rate limits.

Verification links must contain high-entropy opaque tokens; store only a cryptographic hash. On verification, atomically validate expiry, site, source, and request state before issuing a download authorization.

### 8.11 Reader email subscription lifecycle

- `POST /api/v1/public/email-subscriptions` — accept `EmailSubscriptionRequestSchema`; return a generic confirmation-pending response that does not reveal existing addresses.
- `POST /api/v1/public/email-subscriptions/confirm` — redeem a purpose-bound confirmation token; activate the subscription atomically and idempotently.
- `POST /api/v1/public/email-subscriptions/unsubscribe` — redeem an unsubscribe token; immediately set the list subscription to `unsubscribed` and suppress further marketing. The public response must be generic and idempotent.
- `GET /api/v1/public/email-subscriptions/unsubscribe` — render a no-login confirmation page and support the applicable email-client one-click unsubscribe protocol; the request must not unsubscribe merely because a link scanner performed a GET.

Do not accept a caller-supplied `consentedAt` as authoritative. The server records the actual timestamp, form/source, wording version, privacy notice version, and request correlation. Support double opt-in, token expiry/replay, list scoping, per-IP/email rate limiting, suppression sync, and deletion/retention rules.

### 8.12 Future paid-plan and billing API boundary

Do not expose checkout or subscription mutation endpoints until D-19, D-20, and D-21 are approved and a billing provider has passed review. Future API contracts should be designed around:

- Public read-only `GET /api/v1/public/plans` returning only currently published, effective plan and price versions.
- Authenticated customer checkout and billing-portal operations, scoped to the authenticated tenant/customer.
- Signature-verified, idempotent billing webhooks with replay protection and reconciliation.
- Server-side entitlement checks for every paid capability; UI-only gating is insufficient.

Amounts, tax language, cancellation/refund guarantees, and plan benefits must come from the approved versioned catalog, never hardcoded UI copy.

### 8.13 Error codes

| HTTP | Code | Meaning |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Invalid request schema |
| 401 | `UNAUTHENTICATED` | Missing or invalid identity |
| 403 | `FORBIDDEN` | Action or site scope not authorized |
| 404 | `NOT_FOUND` | Resource does not exist in authorized scope |
| 409 | `SITE_CONFLICT` | Duplicate slug/domain or conflicting state |
| 409 | `IDEMPOTENCY_CONFLICT` | Key reused with a different operation |
| 413 | `UPLOAD_TOO_LARGE` | Upload exceeds configured limit |
| 422 | `SOURCE_REJECTED` | Source failed validation or policy |
| 422 | `QUALITY_GATE_FAILED` | Content is not eligible to publish |
| 429 | `RATE_LIMITED` | Request rate exceeds policy |
| 503 | `FEATURE_PAUSED` | Applicable kill switch is active |
| 503 | `DEPENDENCY_UNAVAILABLE` | Required provider/storage/queue is unavailable |

---

## 9. Service interfaces

### 9.1 Site service

```ts
export interface SiteService {
  create(input: SiteConfigInput, actor: AuthContext): Promise<SiteSummary>;
  get(siteId: string, actor: AuthContext): Promise<SiteConfigView>;
  update(siteId: string, patch: SiteConfigPatch, actor: AuthContext): Promise<SiteConfigView>;
  resolveHost(host: string, trustedProxy: boolean): Promise<PublicSiteContext | null>;
  setKillSwitch(
    siteId: string,
    switchName: "ingestionPaused" | "generationPaused" | "publishingPaused",
    paused: boolean,
    actor: AuthContext,
  ): Promise<void>;
}
```

### 9.2 Ingestion service

```ts
export interface SourceIngestionService {
  ingestUpload(input: {
    siteId: string;
    stream: NodeJS.ReadableStream;
    filename: string;
    declaredContentType: string;
    rightsStatus: z.infer<typeof RightsStatusSchema>;
    rightsEvidence?: string;
    actor: AuthContext;
  }): Promise<{ sourceId: string; jobId: string; duplicate: boolean }>;

  ingestUrl(input: {
    siteId: string;
    url: string;
    rightsStatus: z.infer<typeof RightsStatusSchema>;
    rightsEvidence?: string;
    actor: AuthContext;
  }): Promise<{ sourceId: string; jobId: string; duplicate: boolean }>;
}
```

### 9.3 AI provider interface

```ts
export interface DraftRequest {
  contractVersion: string;
  promptVersion: string;
  siteId: string;
  language: string;
  format: "article" | "feature" | "brief";
  editorialProfile: {
    audience: string;
    voice: string;
    allowedCategories: string[];
  };
  evidence: Array<{
    sourceId: string;
    chunkId: string;
    pageNumber: number;
    text: string;
    textSha256: string;
  }>;
}

export interface ProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
}

export interface DraftProvider {
  readonly providerId: string;
  generateDraft(input: DraftRequest, signal: AbortSignal): Promise<{
    output: unknown;
    modelId: string;
    usage?: ProviderUsage;
    providerRequestId?: string;
  }>;
}
```

The application validates the `unknown` output with the shared schema. Provider SDK types must not leak into domain contracts.

### 9.4 Quality gate interface

```ts
export type GateStatus = "pass" | "fail" | "warning" | "not_applicable";

export interface QualityCheck {
  code: string;
  status: GateStatus;
  details?: string[];
  evidenceRefs?: string[];
}

export interface QualityGateResult {
  eligibleToPublish: boolean;
  policyVersion: string;
  checks: QualityCheck[];
}

export interface QualityGateEngine {
  evaluate(input: {
    site: SiteConfigInput;
    sourceDocuments: SourceDocument[];
    article: ArticleDraft;
    claims: ClaimEvidence[];
    destinationHealth: "healthy" | "unhealthy" | "unknown";
  }): Promise<QualityGateResult>;
}
```

Hard-fail gates for v1:

- source exists and extraction is complete
- rights are explicitly allowed
- all citations resolve to stored source/evidence records
- material claims are supported and no high-impact conflict remains unresolved
- article conforms to the block schema
- destination is active and publishing is not paused

Warnings cannot override hard failures. Human approval cannot convert a hard fail into pass unless a documented policy specifically marks that check as human-overridable.

### 9.5 Publishing interface

```ts
export interface PublishDestination {
  readonly destinationId: string;
  publish(input: {
    siteId: string;
    article: ArticleDraft;
    revision: number;
    idempotencyKey: string;
  }): Promise<{ remoteId: string; canonicalUrl: string }>;
  verify(input: { siteId: string; remoteId: string }): Promise<{
    exists: boolean;
    canonicalUrl?: string;
    revisionHash?: string;
  }>;
  unpublish?(input: { siteId: string; remoteId: string }): Promise<void>;
}
```

The destination adapter must document whether its remote API supports idempotency. If not, the platform must perform lookup/reconciliation before create and persist the remote identifier before retrying.

---

## 10. Queue contracts

Use versioned job payloads validated before enqueue and before processing.

```ts
export const ProcessSourceJobSchema = z.object({
  version: z.literal(1),
  jobId: IdSchema,
  siteId: IdSchema,
  sourceId: IdSchema,
  correlationId: IdSchema,
});

export const GenerateDraftJobSchema = z.object({
  version: z.literal(1),
  jobId: IdSchema,
  siteId: IdSchema,
  articleId: IdSchema,
  generationId: IdSchema,
  correlationId: IdSchema,
});

export const PublishArticleJobSchema = z.object({
  version: z.literal(1),
  jobId: IdSchema,
  siteId: IdSchema,
  articleId: IdSchema,
  revision: z.number().int().positive(),
  destinationId: IdSchema,
  idempotencyKey: z.string().min(1),
  correlationId: IdSchema,
});
```

Queue rules:

- Never put file contents, tokens, emails, or provider credentials in a job payload.
- Jobs are at-least-once; handlers must be idempotent.
- Define bounded retry counts, exponential backoff, and dead-letter handling per queue.
- Persist job state in MongoDB; Redis is execution infrastructure, not the only record of a business operation.
- Check kill switches and current policy immediately before external side effects.

---

## 11. Security, privacy, and data lifecycle

### 11.1 PDF fetch and parsing

- Use a dedicated restricted worker with no privileged host mounts.
- Apply byte, page, CPU, memory, and wall-clock limits.
- Validate DNS results and every redirect; prevent DNS rebinding by enforcing the resolved destination at connection time.
- Disable outbound worker networking except for the controlled fetch stage.
- Treat PDF metadata, text, links, and embedded instructions as untrusted.
- Quarantine parser failures and suspicious files.

### 11.2 HTML and rendering

- Render only typed content blocks.
- Escape text by default.
- No arbitrary HTML block in v1.
- Any future HTML feature requires a maintained sanitizer and explicit allowlist.
- Do not store scripts, event handlers, or executable templates in the database.

### 11.3 Authentication and sessions

- Identity provider, session storage, MFA requirements, and password policy are **Decision required**.
- Cookies must be `HttpOnly`, `Secure`, and an appropriate `SameSite` setting.
- Admin routes require CSRF protection when cookie-authenticated.
- Service credentials must be scoped, rotated, and excluded from logs.

### 11.4 Lead privacy

- Normalize email for lookup; do not log raw email.
- Separate transactional verification consent from marketing consent.
- Store only needed data and define deletion workflows.
- Lead identity scope (global or per-site) is **Decision required**; v1 default is per-site isolation.
- Provide a deletion and export path consistent with approved legal requirements.

### 11.5 Retention configuration

Exact retention periods are **Decision required** before production. Define and implement policy separately for:

- original source files
- extracted text/evidence
- generated drafts and revisions
- leads and verification requests
- download tokens
- operational logs and audit events
- provider usage metadata

Deletion must remove object storage data and database references; backups must follow documented expiry and legal hold procedures.

---

## 12. Observability and audit events

### 12.1 Structured log fields

Where applicable:

- `timestamp`
- `level`
- `service`
- `requestId`
- `correlationId`
- `siteId`
- `actorId`
- `sourceId`
- `articleId`
- `revision`
- `jobId`
- `providerId`
- `errorCode`

Never include raw tokens, passwords, full provider prompts, source text, unredacted email, or secret references that reveal infrastructure.

### 12.2 Audit event contract

```ts
export interface AuditEvent {
  eventId: string;
  occurredAt: Date;
  actorId: string;
  actorType: "user" | "service" | "system";
  siteId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  result: "success" | "denied" | "failure";
  requestId: string;
  correlationId: string;
  changedFields?: string[];
  reasonCode?: string;
}
```

Audit events are append-only. Access to audit data is permissioned and itself audited.

### 12.3 Metrics and alerts

Measure at minimum:

- queue depth, oldest job age, retry count
- PDF fetch/extraction success and failure rate
- AI generation latency, failure rate, tokens/cost
- quality-gate fail counts by code
- publish success, verification latency, reconciliation cases
- verification conversion and download completion
- public response availability and latency

Alert on sustained queue backlog, repeated provider failures, unexpected ingestion volume, download abuse, publishing failure spikes, and site availability issues.

---

## 13. Testing specification

### 13.1 Unit tests

Required tests for:

- schemas and request validation
- hostname normalization and site resolution
- authorization and site-scope guards
- rights state transitions
- URL and redirect validation
- checksum deduplication
- evidence page references
- provider response normalization
- claim/citation quality gates
- idempotency keys and job state transitions
- atomic download-token redemption
- retention and deletion policy

Unit tests must not require real external providers or production credentials. Use deterministic clocks, fake provider adapters, and storage/database test doubles where appropriate.

### 13.2 Integration tests

Use disposable or isolated test infrastructure for:

- MongoDB indexes and repository queries
- Redis queue retry and lease behavior
- object-storage access control
- mail delivery adapter boundary
- transaction/race behavior for token redemption
- destination adapter reconciliation

### 13.3 Playwright tests

Critical user journeys:

1. Admin creates a draft site; unknown host remains rejected.
2. Admin uploads an approved PDF; source status and provenance appear.
3. Admin generates a draft; claims link to evidence.
4. Failed gate blocks publish and displays actionable reasons.
5. Eligible revision publishes to staging and is remotely verified.
6. Repeating a publish request does not create a duplicate.
7. Public page renders under correct site brand, canonical, and metadata.
8. Lead submits request, verifies email, downloads once, and replay is denied.
9. User from site A cannot read site B source/article/job data.

Use test-only mail interception and seeded fixtures. Never send real leads or emails in automated tests.

### 13.4 Black-box tests

Verify externally observable behavior without relying on internal implementation:

- unknown host returns a safe not-found response
- private and metadata IP URL fetch is denied
- malformed PDF is rejected/quarantined
- source with unknown/blocked rights cannot publish
- broken citation and unsupported material claim block publication
- provider outage leaves article in a visible held/failed state
- duplicate publish retry results in one destination article
- invalid, expired, or redeemed token is denied
- unauthorized cross-site request reveals no resource existence
- rollback restores expected staging destination state

### 13.5 Regression policy

Every pull request runs:

- affected module unit tests
- affected integration tests
- relevant Playwright tests
- relevant contract tests

Trust-boundary changes also run security-focused black-box suites. Release candidates run the complete regression, security, load, backup-restore, and migration pilot suites. Do not require the full system suite for unrelated documentation or isolated styling changes.

### 13.6 AI evaluation corpus

Version and retain legally safe, synthetic or licensed fixtures for:

- straightforward supported claims
- unsupported claims
- conflicting sources
- duplicate source text
- fabricated citation attempts
- prompt-injection text
- rights denied/unknown
- scanned PDF with OCR errors
- invalid or empty provider response

Compare provider outputs against deterministic schema and policy assertions. Model prose similarity is not a correctness metric.

---

## 14. Error handling and retry semantics

- Validate at API ingress and return stable error codes.
- Do not silently treat provider, database, or storage errors as success.
- Use retry only for transient failures such as timeouts, throttling, and selected 5xx responses.
- Do not retry validation, authorization, rights, or quality failures automatically.
- Apply bounded exponential backoff with jitter.
- Move exhausted jobs to a visible failed/dead-letter state with correlation information.
- Preserve the original error classification while redacting sensitive details.
- Operator retry requires current policy and kill-switch checks.

---

## 15. Migration interfaces

### 15.1 Export manifest

```ts
export interface MigrationManifest {
  migrationId: string;
  siteId: string;
  sourceSystem: "wordpress";
  startedAt: string;
  contentCounts: {
    posts: number;
    pages: number;
    media: number;
    redirects: number;
  };
  checksum: string;
  status: "created" | "exported" | "validated" | "imported" | "cutover" | "rolled_back";
}
```

### 15.2 URL mapping

```ts
export interface UrlMapping {
  siteId: string;
  oldUrl: string;
  newPath: string;
  redirectStatus: 301 | 302 | 410;
  validationStatus: "pending" | "valid" | "invalid" | "manual_review";
  reason?: string;
}
```

Migration must be split into independently auditable operations: export, import, content reconciliation, URL validation, analytics verification, cutover, rollback rehearsal. Production cutover is blocked until publishing authority, DNS ownership, backups, and rollback approval are explicitly confirmed.

---

## 16. AI vendor compatibility plan

### Initial implementation

- Implement the provider interface and one chosen adapter.
- Keep provider model ID and contract version in every generation record.
- Use recorded/synthetic responses for repeatable tests.
- Add a live smoke test only in a protected environment with explicit credentials and spend limits.

### Additional providers

Candidate providers include OpenAI, Azure OpenAI, Anthropic, Google Gemini, Mistral, Cohere, and compatible hosted/local endpoints. Provider availability and product/model names change; verify supported API capabilities and terms against current official documentation when selecting a provider.

Add a provider only after:

1. It passes the same contract tests.
2. Structured output is normalized without weakening validation.
3. Timeout, rate-limit, and partial-failure behavior is tested.
4. Evaluation corpus results are reviewed.
5. Cost, latency, data handling, and retention are approved.
6. The provider can be disabled independently without affecting other site functions.

Do not silently fail over to another provider for content generation. A failover changes data handling, quality, and cost; require explicit configured policy and record which provider generated the revision.

---

## 17. Deployment and release controls

- Separate development, staging, and production credentials and data.
- Production destinations are disabled by default until the owner approves the publisher per domain.
- Deploy immutable builds and version database migrations.
- Use backward-compatible schema changes where rolling deployments are used.
- Verify health checks before shifting traffic.
- Never run production migrations or cutovers without explicit approval.
- Maintain an operator procedure to pause ingestion, generation, or publishing independently.
- The initial application-host constraint is a dedicated VPS with 8 vCPU and 8 GB RAM. See [DEPLOYMENT_AND_CAPACITY_BASELINE.md](./DEPLOYMENT_AND_CAPACITY_BASELINE.md) for the proposed topology, provisional memory budget, limits, and capacity test. This does not establish a workload capacity, availability SLO, RPO/RTO, or production approval.
- The recommended deployment keeps MongoDB, Redis, and object storage external/private instead of colocating all durable state on the application VPS. Any all-in-one alternative requires explicit resilience risk acceptance and restore evidence.
- A single VPS is a single point of failure. Docker Compose may orchestrate containers but does not provide high availability.

### Release gate evidence

Record for each release:

- build identifier and commit
- migration version
- test commands and observed results
- unresolved defects and risk acceptance
- security/privacy review status
- backup/restore evidence when relevant
- rollback owner and steps
- enabled domains and provider configuration

---

## 18. Implementation sequence and phase acceptance

### Phase A — Repository discovery and decisions

Deliver:

- actual repo/system inventory
- current tests, deployment, and integration map
- approved publishing authority per initial domain
- rights states and actions
- initial provider and retention decisions

No feature implementation begins until the actual repository has been inspected and blockers are assigned.

### Phase B — Secure foundation

Implement:

- validated runtime configuration
- authentication adapter and RBAC
- site registry and unique hostname resolution
- site-scoped repositories
- audit/correlation
- kill switches

Accept only with cross-site authorization tests and unknown-host fail-closed tests passing.

### Phase C — One-site content vertical slice

Implement:

- staging site configuration
- safe PDF upload and extraction
- evidence storage and rights checks
- one AI adapter and structured output validation
- quality gates
- preview and staging-only publication

Accept only when the good-source and bad-source black-box flows both pass end to end.

### Phase D — Publishing and download controls

Implement:

- idempotent jobs and destination verification
- reconciliation and rollback
- email verification and download token redemption
- rate limits, consent, retention

Accept only after duplicate publish, token replay, expiry, and cross-site misuse tests pass.

### Phase E — Multi-site and integrations

Implement:

- approved theme presets
- multi-site cache isolation
- canonical/sitemap policy
- per-site analytics metadata and secrets references

Accept only after two or more distinct test sites render and remain isolated.

### Phase F — WordPress pilot and production readiness

Implement:

- export/import validation
- URL mapping and redirect checks
- pilot cutover rehearsal
- rollback rehearsal
- load and restore drills

Production launch requires explicit business and operations sign-off.

### Phase G — Email subscription lifecycle and commercial readiness

Implement separately permissioned reader email subscriptions/unsubscribe and, only if D-20/D-21 approve, customer plans, billing-provider integration, and entitlement enforcement. Never couple marketing consent to download forms, terms acceptance, or paid checkout.

Accept reader subscriptions only after confirmation, one-click unsubscribe, suppression propagation, rate limits, deletion/retention, and token/link-scanner tests pass. Accept paid billing only after approved plan/price/terms versions, tax/legal review, provider webhook signature and idempotency tests, reconciliation, cancellation/refund paths, entitlement boundary tests, and end-to-end sandbox checkout pass. Production payment processing requires explicit sponsor, finance, legal, security, and operations release approval.

---

## 19. Unresolved decisions register

Resolve these before implementing the affected production behavior:

| Decision | Default for development | Approval required before production |
|---|---|---|
| Authoritative publisher per domain | Staging destination only | Yes |
| First AI provider/model | One provider adapter; model configured by environment | Yes |
| Rights evidence and allowed states | Unknown/review/blocked cannot auto-publish | Yes |
| Lead identity scope | Per-site isolation | Yes |
| Retention periods and deletion SLA | No production retention assumptions | Yes |
| RPO/RTO | Not specified | Yes |
| Expected traffic, PDF limits, AI spend | Conservative local limits only | Yes |
| Authentication provider and MFA policy | Adapter boundary only | Yes |
| Domain and DNS ownership | Staging hostnames only | Yes |
| Reader subscription and unsubscribe behavior | Separate explicit opt-in; double opt-in pending D-18 approval | Yes |
| Terms/privacy/marketing notice versions | No legal text or policy inferred | Yes |
| Paid subscription scope and pricing | No prices or payment processing in initial slice | Yes |

---

## 20. Definition of done

A task is complete only when:

- code matches the approved contract
- authorization and site scope are verified
- validation errors are explicit and stable
- unit tests pass
- relevant integration tests pass
- relevant Playwright journeys pass
- black-box checks for changed trust boundaries pass
- regression tests pass
- defects found by audit are fixed and re-tested
- documentation and operational instructions are updated
- no unresolved critical defect remains

A phase is complete only when the full phase acceptance criteria pass in a staging environment and the evidence is recorded.
