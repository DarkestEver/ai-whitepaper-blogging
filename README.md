# Centralized Multi-Site Publishing Platform

## Project goal

Build one central control plane and content workflow for our own independently branded publishing websites. The platform should manage site configuration, approved source documents, evidence-backed drafts, deterministic quality gates, publishing, lead downloads, optional reader email subscriptions, analytics, and controlled WordPress migration while enforcing site isolation. The current product direction excludes a vendor-facing whitepaper marketplace, paid syndication campaigns, and vendor lead delivery. Paid customer subscriptions and billing are not in the selected scope and remain blocked on formal business, legal, finance, tenant, and provider decisions.

## Current project status

**Prototype implementation stage. This repository is not yet the production publishing platform.** See the [implementation status](./IMPLEMENTATION_STATUS.md) for completed work, validation evidence, pending phases, and approval blockers.

The application has been converted from Vite to **Next.js** and now provides a server-rendered public research-library prototype backed by local SQLite, with synthetic catalog entries, search/topic filtering, URL-driven pagination (six results per page), detail pages, and prototype-only no-index controls. Pagination updates with the filtered result count and preserves active search/topic filters while navigating. A protected local admin prototype supports content CRUD; editorial metadata; SEO/social metadata; GEO (generative-engine optimization) summaries, entities, facts, and FAQs; geographic targeting; and local JPEG/PNG/WebP cover uploads. It also includes a local multi-site registry, validated public hostnames, incoming-Host resolution with fail-closed behavior for unknown hosts, per-site public content scoping, site-specific AI draft context, bulk source intake, mock-tested OpenAI/Anthropic/Gemini draft adapters, a local editorial review gate, local scheduling, a 36-preset draft catalog, and an integration-status view. These capabilities remain prototype-only: production identity/admin tenant isolation, trusted-proxy and cache/CDN guarantees, approved source/evidence processing, independent role-separated editorial approvals, durable publishing, leads, billing, and operations remain unimplemented or out of scope. The domain owner is responsible for mapping DNS to the host; this app does not configure DNS or TLS. Repository ownership/target and production decisions remain subject to Phase 0 approval. Do not connect production credentials, provider accounts, or real data based on this prototype.

The initial application-host constraint supplied for planning is a **dedicated VPS with 8 vCPU and 8 GB RAM**. It is not a capacity or availability guarantee. See the [deployment and capacity baseline](./DEPLOYMENT_AND_CAPACITY_BASELINE.md); database, queue, object-storage, region, resilience, and workload decisions still require validation and approval.

## Documentation map

Read in this order:

1. [Enterprise implementation pack](./ENTERPRISE_IMPLEMENTATION_PACK.md) — governance, phase gates, owners, release controls, and implementation handoff.
2. [Project decision register](./PROJECT_DECISION_REGISTER.md) — approvals and unresolved decisions that block dependent work.
3. [Deployment and capacity baseline](./DEPLOYMENT_AND_CAPACITY_BASELINE.md) — deployment guidance for the dedicated 8-vCPU/8-GB VPS and its explicit single-node limits.
4. [Frontend, theme, and integration specification](./FRONTEND_THEME_AND_INTEGRATION_SPEC.md) — professional UI requirements, 36-preset catalog, page templates, accessible dialogs, validation layers, integration catalog, and Playwright/visual testing.
5. [Technical specification](./TECHNICAL_SPECIFICATION.md) — API, schemas, persistence, service interfaces, security controls, and test requirements.
6. [End-to-end implementation/testing/audit plan](./END_TO_END_IMPLEMENTATION_TESTING_AUDIT_PLAN.md) — phase-by-phase test, fix, audit, and repeat loop.
7. [GitHub issue backlog](./GITHUB_ISSUE_BACKLOG.md) — initial issue decomposition. Reconcile it with approved decisions before creating tracker issues.
8. [Implementation plan](./IMPLEMENTATION_PLAN.md) — concise phase sequence.
9. [Developer-ready blueprint](./DEVELOPER_READY_BLUEPRINT.md) — architecture and domain model overview.
10. [Implementation status](./IMPLEMENTATION_STATUS.md) — completed prototype tasks, pending work, validation evidence, and production blockers.
11. [Codex and Claude Code instructions](./AGENTS.md) and [Claude Code entry point](./CLAUDE.md) — repository-specific safe execution workflow.

### Document precedence

1. Signed business, security, privacy, and operational approvals and approved ADRs
2. Project decision register (approved records only)
3. Enterprise implementation pack
4. Technical specification
5. Backlog and earlier planning documents

When an approved decision changes a contract, update the technical specification, tests, API documentation, and affected issues together.

## Implementation sequence

1. **Phase 0 — Discovery and target confirmation:** confirm repository, systems, domains, hosting, data, integrations, and baseline.
2. **Phase 1 — Decisions, threat model, and secure foundation:** approve blockers; implement identity/RBAC, site scoping, audit, secrets, and kill switches.
3. **Phase 2 — Source intake, rights, and evidence:** validate authorized sources and page-aware evidence.
4. **Phase 3 — Draft generation and quality gates:** integrate one AI provider and enforce deterministic quality controls.
5. **Phase 4 — Editorial review and staging publication:** preview, approve, publish idempotently, and reconcile.
6. **Phase 5 — Lead capture and protected downloads:** consent-aware email verification and one-use download authorization.
7. **Phase 6 — Multi-site expansion and integrations:** validated presets, cache isolation, SEO, and approved adapters.
8. **Phase 7 — WordPress pilot:** export/import validation, URL reconciliation, cutover rehearsal, and rollback.
9. **Phase 8 — Operational readiness:** capacity, security, restore, operations, and separately approved rollout.
10. **Phase 9 — Email subscriptions and commercial plans:** separate reader opt-in/unsubscribe and, only if approved, paid plans, pricing, and billing.

Do not skip gates or move to production based only on a successful build.

The current phase status and recommended next implementation order are maintained in [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md). Codex and Claude Code must read the root agent instructions before making changes.

## Mandatory work loop

For each task:

**Requirement → function/interface → unit tests → integration tests → Playwright (where UI applies) → black-box tests (where trust boundaries apply) → regression → fix → audit → repeat.**

Record actual commands and observed results. A test type that does not apply must be marked not applicable with a reason. Fix root causes, then rerun failed, adjacent, and relevant regression tests before closing the task.

## Run the local prototype

```powershell
npm install
npm test
npm run typecheck
npm run dev
```

The public sample library is at `http://localhost:3000`. Admin is at `http://localhost:3000/admin/login`. Admin requires `ADMIN_PASSWORD_HASH` and `SESSION_SECRET`; there is deliberately no default or committed password.

Generate a local password hash without putting the password on the command line:

```powershell
$secure = Read-Host "Local prototype admin password (14+ characters)" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  $hash = $password | npm run --silent admin:hash
  $env:ADMIN_PASSWORD_HASH = $hash.Trim()
  $env:SESSION_SECRET = node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('base64url'))"
  npm run dev
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  Remove-Variable password -ErrorAction SilentlyContinue
}
```

`DATABASE_PATH` defaults to the ignored local file `.data/publisher.sqlite`; parent directories for custom file paths are created automatically. Set it to `:memory:` only for local tests where the server process is stable. This SQLite store is for the local prototype only. Production startup currently fails closed; migrations, supported production storage, backup/recovery, distributed rate limits, and approved identity are pending.

Content records include author/type/language/date, industry/audience/geographic target, tags, source attribution, SEO title/description/keywords/canonical URL, GEO answer summary/entities/facts/FAQs, featured status, and cover image/alt text. Public pages render these as page content, Open Graph/Twitter metadata, and JSON-LD while remaining `noindex,nofollow` pending launch approval. Local cover images are size-limited, checked against JPEG/PNG/WebP file signatures, stored under ignored `.data/media`, and served by a constrained media route. Each site's public base URL supplies absolute canonical and social URLs and is included in AI draft context. Production object storage, image scanning/processing, trusted-proxy and cache/CDN controls, launch SEO policy, and structured-data eligibility review remain pending.

### Configure the local site's public domain

Open **Admin → Sites & themes** (`/admin/sites`) to register each site with a unique slug and HTTPS public base URL, then select **Configure** to edit its description and theme. Enter only the origin: paths, query strings, credentials, and non-local HTTP URLs are rejected. Leave the public URL blank for local-only sites. The public renderer matches the incoming `Host` header against registered public URLs; unregistered hosts return not found. The domain owner maps DNS to the host independently. For a domain to resolve in the app, register it here and ensure the owner routes it to this application.

- scopes the public homepage and article lookup to that site's content and sets homepage/article canonical URLs;
- makes configured cover-image URLs absolute in article Open Graph and JSON-LD metadata;
- gives the AI draft and cover-image prompts the site's domain as identity context, alongside the site name and editorial description.

The domain is a branding/editorial hint, **not evidence** about a site's industry or factual claims. Source text remains the only evidence allowed for generated claims. The local prototype resolves registered hosts and scopes public content, but does not configure DNS/TLS or provide production domain ownership verification, trusted-proxy policy, admin tenant isolation, cache/CDN isolation, or cutover workflow.

### Bulk source library and AI drafts (local prototype)

Open **Admin → PDF library** to upload multiple private PDFs and/or paste external HTTP(S) PDF links (one link per line), assign the selected site targets, and set an individual schedule for every item before adding the batch. Every source requires a future schedule, and a calendar date already assigned to another source cannot be reused. The source list shows each schedule; expand any row to edit its title, target sites, rights details, or schedule. Each batch accepts up to 20 sources, up to 20 MB per uploaded PDF, and 100 MB total uploaded data. Local embedded-text extraction enforces the same 20 MB file limit, a 30-second processing limit, a 200-page limit, and a 110,000-character output cap. This does not scan for malware or provide process isolation/OCR. Each external link is stored only as a reference—the server will not fetch it, so AI generation requires an uploaded PDF.

AI drafting is optional and requires server-side configuration:

- `AI_PROVIDER`: `openai`, `anthropic`, or `google`
- `AI_API_KEY` or the corresponding `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_AI_API_KEY`
- Optional `AI_MODEL` to override the provider's default text model
- Optional `OPENAI_IMAGE_API_KEY` (or `OPENAI_API_KEY` when OpenAI is the text provider) to generate an original AI cover image for each site draft

Never commit keys or paste them into issue reports. AI generation extracts up to 200 pages and 110,000 characters of embedded PDF text, and requests structured editorial, SEO, GEO, FAQ, and page-cited fact fields. Every selected site gets a separate **draft** saved under that site's scope; AI never publishes automatically. A requested date is saved with the source item for editorial scheduling, but generated entries remain drafts and must be reviewed and scheduled individually. If image generation is not configured, drafts are created without generated cover art. The registry seeds one demo site; additional sites can be registered locally under **Admin → Sites & themes**.

AI output is not guaranteed accurate. Page citations are format/range checked, not independently verified against meaning. Scanned PDFs need OCR, which is not included. Uploaded documents are not malware-scanned. Source text is sent to the configured AI vendor; do not enable a provider or submit real/confidential documents until its data-processing terms and your rights to process the source are approved. Keep all generated entries in human review.

Local uploaded source PDFs are stored under ignored `.data/sources` and can be downloaded only from an authenticated admin session. The scheduler for published content remains request-triggered and is not a reliable background job; production requires private object storage, malware scanning, isolated OCR/extraction, a durable scheduler/queue, retry/monitoring, and publishing controls.

## Non-negotiable production controls

- Exactly one authoritative publisher per domain at a time.
- Unknown or blocked rights never auto-publish.
- Unknown hostnames and unauthorized site access fail closed.
- Every site-owned read/write is authorized and site-scoped server-side.
- Extracted source text is untrusted data; it cannot alter system policy or tool permissions.
- AI output is validated structured data, never executable HTML or commands.
- Hard quality-gate failures block publishing.
- Publishing retries are idempotent and externally verified.
- Download grants are hashed, expiring, single-use, and site-scoped.
- Secrets, tokens, and lead PII are not written to logs.
- Production publishing, real lead collection, and domain cutover require explicit approval.

## Decisions that block production

The decision register in the enterprise pack must be completed, approved, and versioned for:

- target implementation repository and hosting/environment
- authoritative publisher per domain
- source-rights taxonomy and allowed actions
- initial AI provider, model, and data-processing terms
- identity provider, MFA, roles, and session controls
- lead identity scope, consent, retention, and deletion
- newsletter purpose, consent wording, confirmation, unsubscribe, and suppression handling
- customer-facing terms/privacy policies, pricing, paid-plan scope, cancellation/refund rules, and tenant ownership
- formal approval of the selected owned multi-site publisher scope; any expansion to vendor-facing hosting/syndication/lead-generation services
- expected traffic, file limits, article volume, and AI cost ceiling
- SLOs, RPO/RTO, support coverage, and recovery ownership
- DNS/domain ownership and migration/cutover authority
- deployment topology and explicit acceptance or remediation of the single-node VPS failure domain

Until approved, use staging or synthetic data only and keep affected production capabilities disabled.

## Definition of done

A task is complete only when implementation, contract changes, relevant tests, audit evidence, operational/rollback notes, and required approvals are recorded. A phase is complete only when its staging exit criteria pass and the evidence is reviewed by its accountable owners.

## License and compliance

This README and the project planning documents do not grant rights to reproduce, redistribute, or publish source documents. Validate licensing, privacy, and jurisdictional requirements with the appropriate owners before processing or publishing real content.
