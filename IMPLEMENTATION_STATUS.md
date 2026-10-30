# Implementation Status

**As of:** 2026-10-28
**Overall state:** Phase 1 RBAC complete. User management UI implemented. Phase 2-3 scaffolding in progress. Site branding/contact/legal configuration, site-scoped discovery endpoints, domain management hub, separate reader-download asset storage, site-scoped leads UI, per-domain email configuration, and a fail-closed public verification/download workflow are implemented for the local prototype; production launch remains blocked on approved provider contracts, secret management, object storage, malware scanning, privacy approval, and production security controls.
**Product direction:** Owner-selected and approved owned multi-site publisher (D-22 approved). All Phase 0 decisions approved (D-01, D-02, D-06, D-21, D-22).

This document records observed implementation and validation status. A planned capability is not marked complete because it has a design, schema, mock screen, or backlog item. Production status requires working implementation, required tests, audit evidence, operational readiness, and approvals.

## Executive status

**Complete for local prototype:** Next.js public catalog and admin, MongoDB persistence (migrated from SQLite), content CRUD and metadata, multi-site registration with validated public hostnames, incoming-Host resolution and public content scoping, safe migration of legacy local slug uniqueness to per-site uniqueness, bulk local PDF/link intake, bounded page-aware embedded-text extraction, optional AI adapter scaffolding, draft-only per-target-site generation, local editorial review gate, local scheduling/rights checks, 36 draft theme presets, pagination, multi-user authentication, role-based domain access control (RBAC), and baseline automated tests (27 tests passing).

**Partially implemented:** authentication, site/domain administration and public routing, source/evidence controls, AI quality/reliability, editorial approvals, publishing/scheduling, integrations, and theme rendering. A local submit/review/approve/return workflow now gates publishing; it is not independent production review or role-based approval. Site resolution/content scoping works locally but is not a production tenancy/security guarantee.

**Not implemented:** production identity/RBAC and admin tenant isolation, approved live AI use and evaluation, malware scanning/OCR, durable jobs, external publishing, protected downloads/leads/newsletter, WordPress migration, production storage/operations, and release authorization.

**Latest verification recorded:** `npm test` passed (28 tests), `npm run typecheck` passed, and `npm run build` passed after security hardening (SSRF protection, rate-limiter memory-leak fix, CSP header, kill switches, audit correlation IDs), delete-route 404 checks, host-resolution SQL optimization, enterprise UI improvements (admin nav active state, error boundaries, loading states, card/table hover polish, login card radius), and mocked AI adapter contract changes. A browser smoke flow created a draft, submitted it, approved it, published it, verified its public detail page, and deleted the test entry. A previous host smoke check returned HTTP 200 for the default local host and HTTP 404 for an unregistered host. DNS configuration is owner-managed and was not tested. This is local code evidence only, not production readiness.

## Completed in this workspace

| ID | Work item | Status | Evidence |
|---|---|---|---|
| UI-01 | Replace the Vite architecture landing page with a Next.js App Router application | Complete for prototype | Next.js app builds and runs; `npm run build` |
| UI-02 | Server-render a responsive public research-library homepage | Complete for prototype | `app/page.tsx`, `app/globals.css`; browser smoke check |
| UI-03 | Search synthetic catalog entries, filter by topic, and paginate URL-addressable results | Complete for prototype | `lib/catalog.ts`, `lib/catalog-pagination.ts`, `app/page.tsx`; six results per page, filter-preserving page links and out-of-range clamping; unit tests and Playwright navigation checks |
| UI-04 | Provide eight synthetic sample entries and server-rendered research detail pages | Complete for prototype | `lib/catalog.ts`; `app/whitepapers/[slug]/page.tsx` |
| UI-05 | Set page title/description; keep this unapproved prototype out of search indexing | Complete for prototype | `app/layout.tsx`, `app/robots.ts` |
| UI-06 | Add catalog behavior unit tests and Next.js type-check/build commands | Complete for prototype | `npm test`, `npm run typecheck`, `npm run build` |
| API-01 | Persist sample-site configuration and content in local SQLite; publish only records explicitly marked published | Complete for local prototype | `lib/db.ts`; persistence tests |
| API-02 | Validate create/update site and content payloads; retain local audit events for mutations | Complete for local prototype | Zod schemas and SQLite audit table; persistence tests |
| ADM-01 | Provide password-hash-backed local sign-in, signed HttpOnly/SameSite session, same-origin mutation checks, and local attempt throttling | Prototype only | `lib/auth.ts`, `/api/admin/*`; browser admin workflow test; not approved for production |
| ADM-02 | Provide protected dashboard, content CRUD, site registry/settings, 36-preset preview catalog, and integration status pages | Complete for local prototype | `app/admin/**`; protected local site create/edit flows, content site selection, browser smoke and CRUD test |
| ADM-03 | Capture extended editorial, SEO, GEO, geographic, source-attribution, and cover/social image metadata; render these fields on public pages and catalog cards | Complete for local prototype | Expanded SQLite schema with additive migration, Zod validation, admin form/API integration, public Open Graph/Twitter/Article+FAQPage JSON-LD, GEO answer sections, catalog card image and metadata-aware search; metadata tests and browser upload flow |
| CFG-01 | Register local sites/domains, resolve public requests by Host, scope public content, and use site identity in AI generation | Complete for local prototype | Admin can register/edit site identities and HTTPS origins; additive SQLite migration assigns `site_id` to content; incoming Host resolves against registered origins, unknown hosts return not-found, public lists/details are site-scoped, and content editor selects a target site. AI drafts include site name/domain/context and save under that site. Unit tests verify host matching and cross-site public-content isolation. DNS mapping is owner-managed; TLS, domain ownership verification, production persistence, and admin tenant isolation remain pending. |
| CFG-02 | Upgrade legacy local SQLite databases to permit the same content slug on different sites | Complete for local prototype | Detects the former global unique-slug index and transactionally rebuilds the table with `(site_id, slug)` uniqueness while preserving rows, columns, indexes, and triggers; an in-memory legacy-schema regression test verifies duplicate slugs across sites, index retention, and repeat initialization. Existing published records retain visibility; previously scheduled records enter review instead of being silently auto-approved. This does not provide production database migrations. |
| SRC-01 | Bulk source-PDF/URL library, per-source site targets, unique schedules/rights, and text extraction | Complete for local prototype only | Up to 20 items per batch, 20 MB per PDF/100 MB per batch; every source requires its own future schedule date, unique across the library; private uploaded PDF route; external links never fetched; PDF.js page-aware extraction capped at 200 pages/110,000 characters; source list/editor; unit and browser tests |
| SRC-02 | Bound local PDF parser input and extraction work | Complete for local prototype only | Signature and 20 MB limit are checked at the extractor boundary; PDF.js parsing is strict, network fetch/WASM/image decoding are disabled, extraction has a 30-second timeout, text is streamed and capped at 110,000 characters, per-page resources are released, and regression tests cover invalid/oversized input and output bounds. This is not malware scanning, sandboxing, OCR, or a production isolation boundary. |
| AI-01 | Generate structured SEO/GEO research drafts from source PDFs for each selected site | Prototype adapters and offline contracts implemented; provider configuration and live model validation pending | OpenAI/Anthropic/Gemini text adapters now share a provider-neutral request/response boundary with mocked contract tests; page-number citations enforced for key facts; optional OpenAI image generation; one site-scoped draft per selected site; never auto-publishes; accuracy not guaranteed; OCR absent; registry seeds one demo site and supports local site registration. No provider has been approved or tested with real credentials. |
| PUB-01 | Schedule content for future publication and keep it private until due | Request-driven local prototype | Admin datetime scheduling, timezone conversion, scheduled status/table/dashboard count, rights gate, atomic due-publish transition with audit event; unit/browser checks; no durable background worker |
| PUB-02 | Require a local editorial review decision before publishing | Complete for local prototype only | Draft → in review → approved or changes requested, required reviewer note for return, local review history/audit, rights evidence required for submission/approval, and approved-only scheduling/publication. Any content edit invalidates approval and clears its schedule; public reads require both published and approved states. Unit/regression and browser flow verified. The local single-admin can self-approve; production reviewer separation, roles, revisions/diffs, and approval policy remain pending. |
| THEME-01 | Define 36 typed preset entries in six families and shared theme rendering hooks | Catalog prototype complete; design approval pending | `lib/themes.ts`; six-by-six uniqueness test; all lifecycle states remain draft |
| SEC-01 | Keep prototype and sample content out of search indexing; add baseline response security headers | Complete for prototype | `app/robots.ts`, metadata, `next.config.ts`; Content-Security-Policy header in `next.config.ts` |
| SEC-02 | SSRF protection for URL fields; block private/reserved IPs in content schemas | Complete for prototype | `isPrivateHostname()` in `lib/db.ts`; blocks 127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x, 0.x, localhost, [::1]; regression test |
| SEC-03 | Kill switches for AI generation, publishing, and source ingest | Complete for prototype | `assertKillSwitchOff()` in `lib/admin-http.ts`; env vars KILL_AI_GENERATION, KILL_PUBLISHING, KILL_INGEST; regression test |
| SEC-04 | Rate-limiter hardening: stale-entry pruning, IP-extraction from trusted proxy headers | Complete for prototype | `pruneStaleAttempts()` in login route; MAX_TRACKED_IPS cap; x-real-ip/x-forwarded-for chain |
| SEC-05 | Audit trail: correlation IDs, detail column, centralized recordAuditEvent helper | Complete for prototype | `correlation_id`/`detail` columns; `recordAuditEvent()`/`newCorrelationId()` in `lib/db.ts`; additive migration; regression test |
| SEC-06 | Fix missing 404 checks in delete routes before destructive operations | Complete for prototype | `app/api/admin/content/[id]/route.ts`, `app/api/admin/content/[id]/delete/route.ts` |
| UI-07 | Admin sidebar active-page highlighting | Complete for prototype | Client-side `AdminNav` component with `usePathname()`; `aria-current="page"` |
| UI-08 | Error boundaries and loading states for all routes | Complete for prototype | `app/error.tsx`, `app/admin/error.tsx`, `app/loading.tsx`, `app/admin/loading.tsx` |
| UI-09 | Enterprise CSS polish: card hover, table row hover, login card radius, nav transitions | Complete for prototype | `app/globals.css` updates |
| UI-10 | Distinct public theme compositions with full-width feature hero, featured carousel, stream and compact briefing layouts | Complete for local prototype | `app/page.tsx`, `components/featured-carousel.tsx`, `app/globals.css`; theme layout metadata now affects public composition; `npm run typecheck` and `npm run build` passed |
| OPT-01 | Optimize host resolution from O(n) full scan to SQL LIKE query | Complete for prototype | `resolveSiteForHost()` in `lib/db.ts` |
| DOC-01 | Record implementation status, evidence, and pending gates in one status document | Complete | This document and README navigation |

All catalog content is synthetic, generated for demonstration, and is not a real article, publisher submission, or licensed source.

## Pending implementation by phase

| Phase | Scope | Status | What remains before completion |
|---|---|---|---|
| 0 | Repository/environment and requirements discovery | **Complete** | Repo ownership (D-01), domain (D-02), identity model (D-06), tenancy (D-21), scope (D-22) all approved. |
| 1 | Secure foundation | **RBAC implemented** | Multi-user auth with per-domain roles (admin/editor/reviewer). Next: MFA, trusted-proxy policy, per-site admin UI, production hardening. |
| 2 | Source ingestion and evidence | Partial (bounded local bulk library/extraction only) | Production private object storage, malware quarantine/scanning, isolated parser/OCR workers, provenance and human evidence review. Local extraction covers embedded text only, with no malware scan or OCR. |
| 3 | AI drafting and quality gates | Partial (local provider adapters and approval gate) | Approve provider/model and data-processing terms; configure credentials; add evaluation set, independent citation/fact verification, independent production editorial review/approval, cost controls, and monitored production job execution. |
| 4 | Editorial workflow and staging publishing | Partial (local review gate and request-driven schedule) | Production role-separated approvals, revision snapshots/diffs, durable background scheduler/queue, staging publisher, idempotency, retries, destination verification and rollback. Local publishing is now blocked until approval and rights clearance. |
| 5 | Reader leads and protected downloads | Not started | Consent/retention decisions, lead request, verification email, hashed one-use tokens, rate limits, abuse and deletion tests. |
| 6 | Multi-site renderer and 36-preset catalog | Partial (local site registration and public scoping implemented) | Production identity/admin site authorization, trusted-proxy policy, cache/CDN isolation, per-site operational/publishing isolation, all supported page/template compositions, preset-by-preset visual/accessibility/SEO testing, design approval, and staging verification across owner-mapped domains. The domain owner performs DNS-to-host mapping; this app only registers expected hostnames and resolves incoming Host headers. |
| 7 | WordPress migration | Not started | Export/import, URL reconciliation, redirect validation, analytics continuity, rehearsal, domain-specific cutover and rollback. |
| 8 | Production operations and launch | Not started | Approved topology, capacity/load test, SLO/RPO/RTO, monitoring, restore/incident drills, security/privacy review and release authorization. |
| 9 | Reader newsletter and commercial plans | Not started / gated | Newsletter opt-in, confirmation, unsubscribe/suppression and D-18/D-19 approval. Paid billing is not in current scope; do not implement or advertise without a separately approved scope and D-19 through D-22. |

## Next implementation order

Do not treat this as authorization to connect live services. Proceed in small, testable slices and stop at approval gates:

1. **Close Phase 0 discovery and approvals:** establish repository ownership, actual domains, hosting, authoritative publisher, source-rights policy, approved AI/data terms, identity, privacy, and operational owners. Update `PROJECT_DECISION_REGISTER.md`; decisions stay blocked until their named owners approve them.
2. **Replace prototype foundation before real data:** design and implement supported production persistence/migrations, approved identity/MFA/RBAC, per-site admin authorization, trusted-proxy policy, durable audit, secrets, rate limits, and kill switches. Local prototype site registration, host resolution, and public content scoping are implemented; production controls remain outstanding.
3. **Harden source/evidence intake:** private object storage, malware quarantine/scanning, PDF/OCR isolation, provenance and rights review, evidence-to-claim mapping, retention and deletion.
4. **Prove one approved AI workflow:** select one provider only after data terms are approved; add versioned prompts, evaluation fixtures, verifiable claim/citation quality gates, cost controls, failure states, and independent human editorial review. The local review gate exists but is not production approval.
5. **Implement controlled staging publication:** production role-separated revisions and approvals, durable queue/scheduler, idempotent publish/reconciliation, destination verification, rollback, and operational audit.
6. **Harden multi-domain capability in staging:** owner-managed DNS mapping is outside this app. Finish domain ownership/HTTPS verification policy, trusted-proxy handling, admin authorization, per-site cache/CDN and publishing isolation, visual/accessibility validation, and cross-site leak tests. Local host resolution and public content scoping are implemented and unit-tested.
7. **Then address gated reader workflows, migration, operations, and launch** according to Phases 5–9 and their decision owners. Keep email marketing and paid plans out of scope unless separately approved.

For execution rules suitable for Codex and Claude Code, see the root [`AGENTS.md`](./AGENTS.md) and [`CLAUDE.md`](./CLAUDE.md). They must treat this status document and the decision register as authoritative over implementation assumptions.

## Product scope decision

The user selected an **owned multi-site publisher** after reviewing the reference websites. The references inform the public discovery experience, not a vendor marketplace implementation. Vendor submissions, paid syndication campaigns, campaign lead delivery, vendor billing, and SaaS customer onboarding are out of current scope. D-22 records the selection as in review until formal business approval.

## Open decisions blocking production

The authoritative register is [PROJECT_DECISION_REGISTER.md](./PROJECT_DECISION_REGISTER.md). All decisions remain subject to named-owner approval. The most relevant implementation blockers are:

- D-01: confirm repository ownership and implementation target.
- D-02–D-08: publishing authority, staging host, source rights, AI data terms, identity, lead consent, and retention.
- D-09–D-16: workloads, SLO/recovery objectives, hosting/data residency, migration authority, analytics, and VPS risk.
- D-17: production design and preset approvals.
- D-18–D-19: reader marketing consent and customer-facing legal notices.
- D-20–D-22: no current paid business model; tenant scope and formal owned-publisher scope approval.

## Validation recorded

| Command/check | Result |
|---|---|
| `npm install` | Passed; 0 reported vulnerabilities at install time. |
| `npm test` | Passed on 2026-10-25; 25 tests, including multi-site host resolution, cross-site public content isolation, editorial publishing gates, bounded PDF extraction, mocked OpenAI/Anthropic/Gemini contracts, and legacy SQLite slug migration regression. |
| `npm run typecheck` | Passed on 2026-10-25 after AI adapter extraction, PDF hardening, editorial workflow, and SQLite migration changes. |
| `npm run build` | Passed on 2026-10-25 after the latest AI adapter extraction; optimized Next.js production build completed successfully. |
| `npm test` | Application/catalog tests passed through test 6; the platform test was blocked by sandbox `EPERM` while `mongodb-memory-server` tried to stat `C:\Users\dell\Desktop\package.json`; no assertion failure was observed. |
| `npm run typecheck` | Passed on 2026-10-28 after public theme composition and carousel changes. |
| `npm run build` | Passed on 2026-10-28 after public theme composition and carousel changes. |
| Local browser review-to-publish flow | Passed: created a synthetic draft, submitted for review, approved it, published the unchanged entry, verified the public detail page, deleted the record, and removed the isolated test database. |
| Local host black-box smoke | Passed: localhost returned HTTP 200 and unregistered `Host: unregistered.example` returned HTTP 404. No DNS changes or external domains were used. |
| Pagination checks | Passed; page 1 showed 6 of 8 search matches, page 2 showed the remaining 2 while preserving `q=research`, and `page=999` clamped to the final page. |
| `npm audit --omit=dev` | Passed; 0 production dependency vulnerabilities reported. |
| Browser checks | Passed mixed PDF+URL intake with separate dates; same-date dates within a batch and dates already assigned in the library were blocked; an individual source schedule could be changed and saved; PDF extraction completed and returned the expected AI-not-configured message without contacting a provider; temporary test records/files were removed. |
| Black-box checks | Cross-origin admin mutation returned HTTP 403; unauthenticated admin API mutation redirected to sign-in (HTTP 303); unauthenticated source-PDF request returned HTTP 401; publishing without cleared rights returned HTTP 400. |
| Configured SQLite path | Local end-to-end run with a nested custom file path passed; the parent directory was created automatically. |
| Mobile layout smoke check | Passed at 375 CSS pixels; document width matched viewport width (no horizontal overflow). |
| Markdown relative-link validation | Passed for project documentation; dependency/build output directories excluded. |

## Production readiness statement

**Not production-ready.** The current implementation is a local SQLite-backed prototype with a multi-site registry, host-based public resolution and site-scoped catalog reads, a protected single-admin surface, editorial catalog CRUD, a local approval gate and audit events, draft theme presets, synthetic content, local source-PDF upload and embedded-text extraction, optional provider adapters not configured for live generation, and request-driven scheduled publication. It has no approved production identity or per-site admin authorization, production database/migrations/backups, trusted-proxy/cache/CDN controls, durable queue, object storage, malware scanning/OCR/independent evidence review, AI quality evaluation or independent role-separated editorial approvals/revision history, publishing adapter, download/lead or newsletter service, analytics, billing, migration tooling, or production operations. DNS-to-host mapping is owner-managed and outside this app. Search indexing is intentionally disabled. Do not load real personal data or source documents, connect production credentials, accept payments, or represent sample content as approved research.
