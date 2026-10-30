# Developer-Ready Blueprint for the Centralized Multi-Site Publishing Platform

## 1. Objective

This document turns the architecture and delivery plan into a concrete implementation blueprint that a developer can use to build the system in a disciplined, testable, and production-safe way.

This is a greenfield engineering blueprint for a centralized publishing platform that supports multiple branded domains from one control plane while preserving site isolation, evidence-backed AI generation, and migration safety.

---

## 2. Delivery principle

The project must be built in controlled slices.

The required loop for every phase is:
1. Inspect repo and environment
2. Define feature contract
3. Implement function(s)
4. Add unit tests
5. Add Playwright tests
6. Run black-box validation
7. Run regression tests
8. Fix defects
9. Audit security, privacy, and compatibility
10. Repeat until the phase passes
11. Only then move to the next phase

No phase is complete without evidence.

---

## 3. Core product goals

- Run multiple domains from one central system
- Keep site configuration as versioned, typed configuration instead of custom code deployment
- Preserve evidence and rights before AI generation
- Use deterministic policy gates before publishing
- Allow publishing only when quality criteria pass
- Support whitepaper lead capture and short-lived secure downloads
- Preserve URL continuity and rollback safety during migration
- Keep each site isolated from every other site

---

## 4. Architectural decision baseline

### 4.1 One authoritative publisher per domain

For v1, each domain must have exactly one authoritative publisher. This prevents competing publish systems writing to the same domain.

Recommended default:
- public site rendering is centralized
- actual content publishing destination is explicitly owned by one controlled system per domain
- WordPress remains legacy until cutover is completed

### 4.2 One AI provider for the first vertical slice

Do not support multiple AI providers in the first slice.

Recommended default:
- choose one provider for the first production-safe slice
- define a common provider adapter interface
- run contract tests against the chosen provider
- add a second provider only after stable output validation and cost telemetry

### 4.3 Rights-first publication model

The system must use explicit rights states:
- unknown
- allowed
- review_required
- blocked
- expired

Any source in unknown or blocked state must not auto-publish.

### 4.4 Site configuration instead of code deployment

A site is created by configuration:
- hostnames
- theme preset
- content profile
- SEO metadata
- routing rules
- publishing rules
- analytics config
- content rights policy

No arbitrary user-written executable theme code is allowed.

---

## 5. System responsibilities

## 5.1 Admin / control plane

Responsibilities:
- manage domains and site metadata
- manage themes and layouts
- manage source ingestion
- review AI drafts
- inspect claim evidence and citations
- trigger publish or schedule actions
- review job status and audit logs
- manage integrations and credentials

## 5.2 Public renderer

Responsibilities:
- resolve domain to site config
- render approved article content
- enforce SEO metadata and canonical rules
- render theme-specific layouts
- handle public article pages and legal pages
- expose only published site content

## 5.3 Ingestion and evidence engine

Responsibilities:
- receive uploads or approved PDF URLs
- validate source integrity
- deduplicate content
- extract visible text and metadata
- store provenance and evidence chunks
- maintain rights state and source lineage

## 5.4 AI content engine

Responsibilities:
- convert approved evidence to structured article drafts
- produce claim-evidence mappings
- keep provider and model metadata
- enforce policy gates before publishing
- block invalid outputs from publication

## 5.5 Publishing engine

Responsibilities:
- queue article publish operations
- maintain idempotency key per destination
- verify remote publication success
- reconcile partial failures
- allow retry without duplicate article creation

## 5.6 Lead and download engine

Responsibilities:
- collect lead data
- verify email ownership
- issue secure short-lived download tokens
- enforce replay prevention and expiry
- track consent and conversion data

## 5.7 Migration engine

Responsibilities:
- export WordPress source data
- map legacy URLs to new URLs
- preserve asset metadata and redirect logic
- run cutover and rollback flows
- reconcile analytics and content continuity

---

## 6. Tech stack baseline

### Recommended stack
- Runtime: Node.js + TypeScript
- App style: modular monolith with worker processes
- API: REST with versioned routes and schema validation
- Frontend: Next.js admin + public renderer
- Queue: Redis + BullMQ
- Database: MongoDB
- Object storage: S3-compatible storage or equivalent
- Workers: Node.js or Python extraction worker
- Secrets: cloud secret manager or encrypted environment model
- Testing: Vitest/Jest, Playwright, regression suite, API contract tests

### Why this stack
- good fit for site registry and metadata model
- strong ecosystem support for queues and API workflows
- supports modular service boundaries without premature microservices
- realistic for multi-site editorial publishing workflows

---

## 7. Repository structure

```text
publishing-platform/
  apps/
    admin/
    public/
    api/
    worker/

  services/
    pdf-worker/

  packages/
    database/
    contracts/
    site-config/
    theme-engine/
    content-schema/
    evidence/
    ai-providers/
    quality-engine/
    publishing-adapters/
    seo/
    storage/
    observability/
    auth/
    security/

  migrations/
    wordpress/
    database/

  tests/
    unit/
    integration/
    e2e/
    security/
    load/

  infra/
    docker/
    reverse-proxy/
    monitoring/

  README.md
  pnpm-workspace.yaml
  docker-compose.yml
```

---

## 8. Core domain model

## 8.1 Site

```ts
interface Site {
  id: string
  slug: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  primaryDomain: string
  secondaryDomains: string[]
  brandName: string
  themeId: string
  language: string
  contentProfileId: string
  seoPolicyId: string
  publishingPolicyId: string
  createdAt: Date
  updatedAt: Date
}
```

### Required indexes
- unique slug
- unique normalized primary domain
- status + siteId

---

## 8.2 Theme

```ts
interface Theme {
  id: string
  family: string
  version: string
  schemaVersion: string
  publishedState: 'draft' | 'published'
  layoutPresetId: string
  designTokens: Record<string, string>
  createdAt: Date
  updatedAt: Date
}
```

Rules:
- no executable DB-stored templates
- only approved presets and schema validators
- all layout changes must be versioned

---

## 8.3 Source document

```ts
interface SourceDocument {
  id: string
  type: 'pdf' | 'url' | 'upload'
  sourceUrl?: string
  title?: string
  publisher?: string
  publishedAt?: Date
  sha256?: string
  fileAssetId?: string
  rightsStatus: 'unknown' | 'allowed' | 'review_required' | 'blocked' | 'expired'
  licenseEvidence?: string
  extractionStatus: 'pending' | 'completed' | 'failed' | 'quarantined'
  language?: string
  pageCount?: number
  createdAt: Date
}
```

---

## 8.4 Evidence chunk

```ts
interface EvidenceChunk {
  id: string
  sourceId: string
  pageNumber: number
  sectionHeading?: string
  textAssetRef?: string
  textHash?: string
  extractionMethod: 'ocr' | 'pdf-text' | 'manual'
  confidence: number
  createdAt: Date
}
```

---

## 8.5 Claim evidence

```ts
interface ClaimEvidence {
  id: string
  articleId: string
  claimText: string
  claimType: 'fact' | 'statistic' | 'quote' | 'technical' | 'analysis'
  evidence: Array<{
    sourceId: string
    chunkId: string
    pageNumber: number
    quoteHash?: string
  }>
  status: 'supported' | 'unsupported' | 'conflict' | 'needs_review'
  verifierVersion: string
  checkedAt: Date
}
```

---

## 8.6 Article

```ts
interface Article {
  id: string
  siteId: string
  slug: string
  status: 'draft' | 'approved' | 'published' | 'blocked'
  publishedAt?: Date
  sourceIds: string[]
  qualityPolicyVersion: string
  generatedByProvider: string
  generationModel: string
  createdAt: Date
  updatedAt: Date
}
```

### Required indexes
- unique siteId + slug
- siteId + status + publishedAt
- sourceIds

---

## 8.7 Job and publish state

```ts
interface PublishingJob {
  id: string
  articleId: string
  siteId: string
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'reconciled'
  idempotencyKey: string
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  retryCount: number
  leaseExpiresAt?: Date
  createdAt: Date
}
```

---

## 8.8 Lead and token

```ts
interface Lead {
  id: string
  siteId: string
  emailHash: string
  status: 'new' | 'verified' | 'banned'
  consentStatus: 'pending' | 'granted' | 'denied'
  createdAt: Date
}

interface DownloadToken {
  id: string
  siteId: string
  sourceId?: string
  tokenHash: string
  expiresAt: Date
  usedAt?: Date
  revokedAt?: Date
  createdAt: Date
}
```

---

## 9. Security controls

## 9.1 SSRF prevention

Required rules:
- block loopback, private, link-local, and metadata addresses
- validate hostname and redirect chain
- enforce allowlist when feasible
- isolate fetch in a restricted worker
- reject malformed or encrypted PDFs unless supported safely
- enforce page, byte, time, and decompression limits

## 9.2 Prompt injection protection

Required rules:
- always treat extracted text as untrusted evidence
- never allow PDF content to modify instructions, policy, or tool permissions
- separate instructions from data in all model calls
- preserve policy decisions independently from untrusted content

## 9.3 Token protection

Required rules:
- store only hashes of tokens
- enforce short expiry
- reject re-use after first success
- revoke on user or admin action
- never expose tokens in browser or logs

## 9.4 Release and kill switches

Required controls:
- pause ingestion globally
- pause AI generation globally
- pause publishing globally
- pause a specific site
- pause a specific source or job type

These controls must be enforced server-side and auditable.

---

## 10. API contract blueprint

## 10.1 Admin API

### Site endpoints
- `GET /api/v1/admin/sites`
- `POST /api/v1/admin/sites`
- `GET /api/v1/admin/sites/:id`
- `PATCH /api/v1/admin/sites/:id`
- `PUT /api/v1/admin/sites/:id/theme`

### Source endpoints
- `POST /api/v1/admin/sources`
- `POST /api/v1/admin/sources/:id/process`
- `GET /api/v1/admin/sources/:id`

### Article endpoints
- `GET /api/v1/admin/articles/:id`
- `PATCH /api/v1/admin/articles/:id`
- `GET /api/v1/admin/articles/:id/quality`

### Publish endpoints
- `POST /api/v1/admin/articles/:id/publish`
- `POST /api/v1/admin/articles/:id/schedule`
- `GET /api/v1/admin/jobs`
- `POST /api/v1/admin/jobs/:id/retry`

### Analytics endpoints
- `GET /api/v1/admin/analytics/overview`
- `POST /api/v1/admin/integrations/:id/sync`

## 10.2 Public API

- `GET /api/v1/public/articles`
- `GET /api/v1/public/articles/:slug`
- `POST /api/v1/public/download-requests`
- `POST /api/v1/public/downloads/verify`

## 10.3 API conventions

Every API response should include:
- requestId
- correlationId
- status
- errorCode when relevant
- pagination metadata for list endpoints
- site scoping enforcement on every request

No client-supplied siteId may be accepted without authorization.

---

## 11. Validation and test strategy

## 11.1 Unit tests

Required scopes:
- permission checks
- validation schemas
- rights status logic
- prompt and output schema validation
- idempotency logic
- token expiry and replay detection
- URL validation and redirect rules
- cache invalidation rules
- site scoping and host resolution

## 11.2 Playwright tests

Required user journeys:
- admin login and site creation
- source upload and inspection
- draft generation and review
- blocked publish scenario
- lead capture and email verification
- secure download token redemption
- migration preview and redirect check
- multi-site rendering across themes

## 11.3 Black-box tests

Required scenarios:
- malicious PDF upload
- private IP PDF fetch denial
- unsupported claim should fail
- broken citation should fail
- duplicate publish retry must not duplicate content
- cross-site access attempt must fail
- invalid/expired token must be denied
- restore drill must succeed

## 11.4 Regression tests

Required for every change:
- site creation flow
- draft generation flow
- publish success path
- download verification flow
- migration smoke path
- analytics collection flow

---

## 12. Quality gates

All content must pass before publish:
- source integrity
- rights clearance
- factual support
- technical correctness
- originality and differentiation
- safety and prompt injection checks
- citation integrity
- SEO/render validation
- media rights and accuracy
- destination readiness

Warnings may only be allowed through explicit policy. Auto-publish must never happen on unknown or broken evidence.

---

## 13. AI provider contract

The adapter contract must be shared and normalized.

```ts
interface ProviderAdapter {
  generateDraft(input: DraftRequest): Promise<DraftResult>
  validateResponse(output: unknown): Promise<boolean>
  getModelMetadata(): ProviderMetadata
  handleFailure(error: unknown): Promise<ProviderFailureResult>
}
```

Required metadata:
- provider name
- model ID
- prompt version
- generation timestamp
- cost metadata when available
- success/failure status

---

## 14. Draft request and output contract

```ts
interface DraftRequest {
  sourceIds: string[]
  siteId: string
  editorialProfile: Record<string, unknown>
  targetLanguage: string
  citationPolicy: string
  promptVersion: string
  format: 'article' | 'feature' | 'brief'
}
```

```ts
interface DraftResult {
  headline: string
  summary: string
  articleBlocks: unknown[]
  claimEvidence: ClaimEvidence[]
  citations: unknown[]
  mediaBrief?: unknown
  uncertaintyFlags: string[]
  providerMetadata: Record<string, unknown>
}
```

---

## 15. Operational requirements

## 15.1 Logging

Every request and job must include:
- requestId
- correlationId
- siteId
- articleId when relevant
- sourceId when relevant
- jobId when relevant
- provider correlation ID when available

## 15.2 Metrics

Required metrics:
- queue depth and age
- publish latency
- failure rate
- AI cost per article
- extraction failure rate
- verification conversion rate
- download completion rate
- source ingest volume

## 15.3 Alerts

Required alerts:
- queue backlog
- repeated job failure
- unusual ingest volume
- download abuse
- expiring provider credentials
- site availability issues

## 15.4 Backups and recovery

Required:
- database backups
- object storage backups or immutable retention
- restore drill execution
- documented RPO/RTO
- audit log retention and deletion policy

---

## 16. Migration blueprint

## 16.1 Migration phases

1. Inventory and export
2. pilot validation
3. pilot cutover
4. rollback rehearsal
5. batch migration
6. final stabilization

## 16.2 Migration rules

- one authoritative publisher per domain
- map old URL to new URL before cutover
- preserve slugs where possible
- keep 301 redirects for changed paths
- preserve publication dates, metadata, and media where valid
- do not allow old and new systems to publish simultaneously to the same domain
- keep rollback path and backups until acceptance is complete

---

## 17. Engineering execution plan

## Sprint 1 — repo and security foundation
- repo audit
- environment and deployment inspection
- auth and RBAC
- site registry and host resolution
- kill switches
- audit logging

## Sprint 2 — single-site vertical slice
- site config creation
- secure PDF ingest
- evidence extraction
- AI draft generation contract
- quality gate
- preview output

## Sprint 3 — hardening and resilience
- malicious input handling
- rights enforcement
- provider fallback and telemetry
- backup and restore
- retention policy

## Sprint 4 — publish and lead funnel
- idempotent publishing
- destination verification
- lead capture and email verification
- secure tokenized download

## Sprint 5 — expansion
- multi-site rendering
- additional themes
- SEO and analytics isolation
- operational dashboards

## Sprint 6 — migration pilot
- pilot migration
- redirect validation
- rollback rehearsal
- content reconciliation

## Sprint 7 — production readiness
- load test
- final audit
- launch checklist
- release gate signoff

---

## 18. Checkpoint gates

Each phase passes only when:
- implementation is complete
- all affected unit tests pass
- all relevant Playwright tests pass
- all black-box checks pass
- all relevant regression tests pass
- security and privacy review is complete
- major defects are fixed and re-tested

---

## 19. Decisions the team must resolve before implementation begins

The following decisions are required to prevent rework:

1. Which system is authoritative for each domain during v1?
2. What is the exact rights taxonomy and allowed actions for each state?
3. What is the initial AI provider model and output contract?
4. What are the initial retention and deletion rules?
5. What are the expected domain count, traffic, PDF volumes, and AI cost ceiling?
6. What is the defined RPO and RTO?
7. Which site variables and hostname patterns are allowed?
8. Which site is the first pilot production-like domain?

---

## 20. Minimum production slice

Before scaling beyond one site or one provider, the team must prove all of the following in staging:

- site config creation works without code deployment
- unknown hostnames fail closed
- source PDF is safely ingested with checksum and provenance
- extraction yields page-aware evidence chunks
- the selected AI provider produces a schema-valid draft
- citations and claims are traceable to source evidence
- publishing is blocked if evidence, citations, or rights are invalid
- retries are idempotent and destination success is verified
- download access requires email verification and secure token validation
- audit logs and rollback flow work in practice

If these are not proven, do not expand the scope.

---

## 21. Acceptance statement

This blueprint is implementation-ready for a team starting a greenfield build of a centralized publishing platform. It defines the required functions, contracts, security rules, domain model, testing structure, migration limits, and phase milestones necessary to build the system without designing it in a way that is impossible to validate.

The platform should be considered production-ready only after the staged vertical slice is proven, hardened, audited, and validated under realistic operational conditions.
