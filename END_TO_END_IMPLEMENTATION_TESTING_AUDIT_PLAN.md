# End-to-End Implementation, Testing, and Audit Plan

## 1. Operating rule for every phase

Every phase follows the same loop:

1. Define task and acceptance criteria
2. Implement required functions
3. Write unit tests
4. Write Playwright tests
5. Run black-box validation
6. Run regression suite
7. Fix defects
8. Audit for gaps, hidden risks, and compatibility issues
9. Repeat until the phase passes
10. Only then move to the next phase

This is mandatory. No phase is considered done until all relevant checks are executed and observed.

## 1.1 Current status and how to use this plan

As of 2026-10-25, this repository is a local prototype, not a production platform. The verified baseline is 25 passing automated tests, a passing TypeScript typecheck, and a passing Next.js production build; rerun the build after any subsequent code changes. A local HTTP smoke test returned 200 for localhost and 404 for an unregistered Host. Local editorial submit/approve/publish browser verification, bounded PDF extraction checks, and mock-only OpenAI/Anthropic/Gemini adapter contract tests also pass. These results do not satisfy production staging, security, operational, or launch exit gates.

Before taking a task, read [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md) for complete/partial/pending work and [`PROJECT_DECISION_REGISTER.md`](./PROJECT_DECISION_REGISTER.md) for approval blockers. Begin with remaining Phase 0 discovery/approvals and then Phase 1 secure foundations. Do not connect production credentials, real documents, or providers based only on this plan. Local multi-site registry, incoming-Host resolution, and public content scoping are implemented. The domain owner supplies the hostname and maps DNS to the host; this app registers the hostname and routes requests. Production identity, trusted-proxy, cache, and admin isolation controls remain pending.

Codex and Claude Code execution conventions are in [`AGENTS.md`](./AGENTS.md) and [`CLAUDE.md`](./CLAUDE.md). Every phase below remains pending until its acceptance evidence is actually produced and the applicable owners approve its gate.

---

## 2. Delivery lifecycle

The lifecycle is:

Phase -> Task -> Function -> Unit test -> Playwright -> Black-box -> Regression -> Fix -> Audit -> Repeat -> Next phase

This must be followed for every feature, service, and trust boundary.

---

## 3. Phase-by-phase plan

## Phase 0 — Repository and environment audit

### Tasks
- Inspect the current repository and app structure
- Review package scripts, environment config, and deployment assumptions
- Check existing integrations, helper functions, routes, and models
- Identify WordPress migration touchpoints and publishing flows
- Document sites, DNS, content types, hosting environment, and constraints
- Define rights/privacy requirements and critical business constraints

### Functions
- RepoAuditService
- EnvironmentInspector
- DomainInventoryMap
- RightsPolicyCatalog
- MigrationRiskRegister

### Unit tests
- Repo audit output contains required sections
- Domain inventory covers expected site metadata
- Rights catalog includes allowed/blocked states
- Risk register captures migration and security blockers

### Playwright tests
- None at this stage; this is a discovery and documentation phase

### Black-box tests
- Manual verification of current app commands and build flow
- Manual verification of environment assumptions and deployment model
- Manual validation that the repository uses the expected structure and scripts

### Regression tests
- Not relevant yet; baseline repo health should be captured before code changes

### Fix loop
- Document missing assumptions
- Remove false assumptions
- Re-run repo validation until the baseline is clear

### Audit
- Confirm repo state and project constraints are known before code changes
- Check for hidden dependencies, risky assumptions, or untracked infrastructure
- Identify blockers and required architectural decisions

### Exit gate
- Baseline environment and repo state are documented
- No critical unknowns remain for Phase 1

---

## Phase 1 — Secure foundational platform

### Tasks
- Implement auth and RBAC
- Define site registry and host mapping
- Add site-level scoping and tenant isolation
- Add audit logging and correlation IDs
- Add secrets interface
- Add global and per-site kill switches
- Build minimal queue/job runner foundation

### Functions
- AuthService
- PermissionEvaluator
- SiteRegistry
- SiteResolver
- AuditLogger
- CorrelationContext
- SecretProvider
- KillSwitchController
- JobRunner

### Unit tests
- Role and permission enforcement works
- Unknown hostnames fail closed
- Site-level scoping prevents cross-site access
- Audit logs contain request/job/correlation metadata
- Secrets are not exposed in output or logs
- Kill switches block dangerous actions correctly

### Playwright tests
- Admin login succeeds
- Non-admin user cannot access restricted config
- Unauthorized site access is denied
- Site config creation works within correct scope
- Audit logs are visible for key actions

### Black-box tests
- User with site A role cannot access site B data
- Unknown hostname fails closed
- Site kill switch blocks ingest or publish action
- Logs do not expose tokens or PII

### Regression tests
- Existing admin routes remain accessible to authorized users
- Prior site config is not broken by new security checks

### Fix loop
- Identify missing auth constraints
- Fix cross-scope validation bugs
- Re-run unit and Playwright tests
- Re-audit site security boundaries

### Audit
- Check all read/write paths for site scoping
- Verify no direct DB access bypasses permission logic
- Validate secrets handling, correlation IDs, and kill switch behavior

### Exit gate
- Foundation is safe and isolated
- No critical cross-site access issue remains
- All key platform controls are in place

---

## Phase 2 — Single-site vertical slice: one domain, one PDF, one AI provider

### Tasks
- Create one staging site config without code deployment
- Ingest one approved PDF safely
- Extract page-aware evidence and provenance
- Choose one AI provider for v1
- Generate one schema-valid article draft
- Validate claim evidence and citations
- Block auto-publish on invalid quality gate outcomes
- Preview site content in staging

### Functions
- SiteConfigService
- SourceIngestionService
- PDFGuard
- EvidenceChunkBuilder
- RightsPolicyChecker
- ProviderAdapterFactory
- DraftGenerationService
- ClaimEvidenceService
- CitationValidator
- QualityGateEngine
- PreviewRenderer

### Unit tests
- PDF validation rejects invalid or malicious input
- Source provenance is stored
- Duplicate PDF detection works
- Evidence chunks include page references
- Rights-blocked source is rejected
- Draft output matches the schema contract
- Invalid claim/citation blocks publication
- Preview metadata includes canonical and site-specific values

### Playwright tests
- Create a staging site from config without code deployment
- Upload a valid PDF and confirm provenance is stored
- Review extracted evidence and source metadata
- Generate a draft and review claim/evidence links
- Trigger a bad quality gate and confirm block state
- Preview the rendered page with correct metadata

### Black-box tests
- Malformed PDF is rejected or quarantined
- Unknown or restricted source does not publish
- Invalid citation fails the gate
- Draft generation does not silently invent citations
- Preview output reflects the correct site and canonical URL

### Regression tests
- A valid site path still works after the new gate logic is added
- Existing approved source still passes the quality flow
- Site config remains stable after the vertical slice

### Fix loop
- Review failed quality gate conditions
- Fix schema or evidence mapping issues
- Fix allowlist or rights gaps
- Re-run the vertical slice end to end

### Audit
- Confirm the full safe lifecycle works from ingest to preview/publish decision
- Check for silent trust gaps, fake citations, or unsafe generation
- Review all provider outputs against contract expectations
- Check site scoping, kill switches, and data retention assumptions

### Exit gate
- The vertical slice passes end to end in staging
- No unsafe or silent auto-publish path exists
- Core contract between source, evidence, AI, and publish is proven

---

## Phase 3 — Hardening ingestion, AI, and operations

### Tasks
- Add malicious input and SSRF regression suite
- Validate rights state transitions
- Build evaluation corpus for valid and bad content
- Add provider timeout/retry/fallback and telemetry
- Add prompt injection and unsafe content checks
- Rehearse backups and restore readiness
- Define retention/deletion policy for files, text, logs, leads, and tokens

### Functions
- SSRFGuard
- ContentSafetyValidator
- RightsStateMachine
- EvaluationFixtureRunner
- ProviderErrorHandler
- BackupRestoreRunner
- RetentionPolicyEngine

### Unit tests
- SSRF protections reject blocked addresses and redirects
- Rights states move correctly between allowed, review, blocked, and expired states
- Adversarial content fixtures are detected or blocked
- Retry and fallback happen when provider is unavailable
- Retention rules calculate correct expiry behavior
- Restore drill state is consistent and recorded

### Playwright tests
- Attempt malicious upload and verify quarantine or rejection
- Review rights state changes in the UI
- Trigger provider failure and verify retry or hold state
- Test retention and restore workflow in staging

### Black-box tests
- Internal/private address URL is denied
- Malformed or malicious PDF is rejected
- Prompt-injection content in source does not alter system behavior
- Provider outage does not corrupt content state
- Restore drill successfully recovers staging state

### Regression tests
- Valid PDF workflow still succeeds after hardening
- Valid draft generation remains functional after security checks
- Auth and site scoping still pass after new validations

### Fix loop
- Fix any missed malicious input or fallback path
- Address provider drift or schema mismatch
- Re-run hardening tests and restore exercises

### Audit
- Search for unsafe assumptions in PDF, rights, and provider handling
- Confirm retention and deletion rules are operational and testable
- Verify no sensitive values are in logs or reports

### Exit gate
- Intake and AI path is hardened and resilient
- Known malicious and risky scenarios are blocked
- Recovery and retention are ready for broader rollout

---

## Phase 4 — Publishing and lead funnel

### Tasks
- Implement idempotent publishing jobs
- Add reconciliation and rollback logic
- Create lead capture flow
- Add email verification
- Add secure download tokens
- Add rate limiting and consent retention
- Add abuse protections and replay checks

### Functions
- PublishingJobService
- IdempotencyGuard
- ReconciliationService
- RollbackManager
- LeadCaptureService
- EmailVerificationService
- DownloadTokenService
- ConsentTracker
- AbuseRateLimiter

### Unit tests
- Retry of a publish job does not create duplicates
- Partial publish success is reconciled correctly
- Duplicate lead submission is handled correctly
- Email verification rejects invalid or expired requests
- Download token is single-use and expires correctly
- Rate limiting blocks abuse attempts
- Consent states are enforced before download authorization

### Playwright tests
- Submit a lead form
- Verify email and complete the download flow
- Retry the same publish job and verify one destination result exists
- Trigger invalid or expired token scenario and ensure denial
- Confirm rate-limited abuse is visible and blocked

### Black-box tests
- Replay of the same token is rejected
- expired token is denied
- forgery or tampered token is rejected
- duplicate publish job under retry remains single result
- cross-site token misuse is denied

### Regression tests
- Valid publish flow still works after adding token and replay protection
- Lead verification flow still works under normal traffic

### Fix loop
- Fix any race condition or replay gap
- Tighten rate limit or token validation if needed
- Re-run all publish and download tests end to end

### Audit
- Confirm single-use and expiry semantics hold under retries
- Review lead privacy and consent handling
- Check that no PII or token secret is exposed in logs or browser output

### Exit gate
- Publish and download flows are safe, auditable, and repeatable
- No duplicate publish or replay vulnerability remains

---

## Phase 5 — Multi-site expansion

### Tasks
- Add more approved theme presets and design tokens
- Expand the renderer for additional domains
- Add cache invalidation logic per site
- Enforce canonical and SEO metadata per domain
- Add analytics integration with secret isolation
- Add per-site operational dashboards

### Functions
- ThemeEngine
- LayoutValidator
- SiteResolver
- CacheInvalidator
- MetadataValidator
- AnalyticsIntegrationService
- SyncStatusTracker

### Unit tests
- Approved themes can render without arbitrary code execution
- Invalid theme config fails validation
- Cache invalidation matches the correct site or article state
- Canonical and robots metadata are correct by site
- Analytics identifiers are isolated per site

### Playwright tests
- Render the same page under two or more site themes
- Verify canonical/meta values per site
- Validate sticky render behavior after content updates
- Validate site dashboard and analytics status views

### Black-box tests
- One site cannot leak another site’s branding or data
- Cache invalidation does not expose stale content from another domain
- A site-specific analytics credential is not reused across domains

### Regression tests
- Existing single-site behavior still works
- Previously approved templates still render correctly

### Fix loop
- Patch cross-site leak or stale-cache issues
- Re-run multi-site render and analytics flows

### Audit
- Confirm site isolation and cache boundaries are correct
- Check for missing metadata or cross-site token leakage

### Exit gate
- Multi-site scale is valid without architecture drift
- Site-level output is isolated and safe

---

## Phase 6 — WordPress pilot migration

### Tasks
- Export a low-risk pilot domain
- Map URLs and metadata
- Validate cutover plan and rollback path
- Run migration in staging or pilot environment
- Reconcile content, redirects, and analytics
- Execute rollback rehearsal

### Functions
- WordPressExporter
- URLMapper
- MigrationRunner
- RedirectValidator
- RollbackManager
- ContentReconciler

### Unit tests
- URL mapping preserves desired structure
- Migration metadata keeps source IDs and revision history
- Redirect validation rules pass for known cases
- Rollback state transitions are valid

### Playwright tests
- Migrate a pilot domain and verify page rendering
- Check redirect behavior for legacy pages
- Confirm canonical and metadata values are correct after migration
- Verify rollback from a bad cutover

### Black-box tests
- Old and new URLs behave correctly during transition
- Duplicate content is not published to the same domain
- Rollback restores the previous site state

### Regression tests
- Non-migrated domains remain unaffected
- Existing publish flows continue working during migration exercise

### Fix loop
- Fix redirect mismatches or metadata drift
- Fix rollback gaps or reconciliation mistakes
- Re-run migration smoke tests

### Audit
- Confirm migration does not violate URL continuity or analytics integrity
- Check authority boundaries and site ownership after cutover
- Verify rollback path is rehearsed and documented

### Exit gate
- One low-risk domain migration works with recovery proven
- Pilot migration is safe enough to extend to batch migration

---

## Phase 7 — Production readiness and launch gate

### Tasks
- Load tests and system resilience validation
- Backup and restore drill
- Recovery and incident runbooks
- Final security review and close-out
- Launch checklist and risk acceptance

### Functions
- LoadTestRunner
- RestoreOperator
- RunbookManager
- SecurityReviewEngine
- LaunchGateChecker

### Unit tests
- Load thresholds for ingest, generation, and publishing are defined
- Recovery and restore actions preserve required state
- Security checklist flags unresolved risks

### Playwright tests
- Simulate peak flows for upload, generate, publish, and download paths
- Confirm operational dashboards remain valid under load

### Black-box tests
- Staging recovery works under a simulated outage
- Queue backlog recovery is safe and observable
- Security and privacy checks pass against operational data

### Regression tests
- Core lifecycle remains stable after operational hardening
- Full app still works after final pass

### Fix loop
- Fix any production-readiness issue discovered in loads or restore drills
- Re-run evidence and final gate checks

### Audit
- Confirm all high-risk issues are closed or explicitly accepted
- Confirm launch conditions are met by observed evidence
- Validate that rollback, monitoring, and ownership are ready

### Exit gate
- Production launch is approved only when evidence supports it
- No unresolved critical or high-severity issue remains

---

## Phase 8 — Email subscriptions, terms, and pricing readiness

This is a separately gated commercialization phase. Reader newsletter subscriptions are distinct from download leads and paid platform subscriptions. Paid billing remains optional and cannot begin until business, tenant, finance, legal, security, and provider decisions are approved.

### Tasks
- Implement explicit reader email opt-in, confirmation, list preferences, one-click unsubscribe, and suppression propagation.
- Publish approved, versioned terms, privacy/cookie notices, and marketing consent wording with effective dates and owners.
- Define the plan catalog and immutable price versions only after approval of pricing, currency, interval, taxes, limits/entitlements, trials, discounts, cancellations, refunds/proration, and price-change notices.
- If paid plans are approved, integrate a reviewed payment provider, customer portal, verified webhook processing, reconciliation, invoices/receipts, and server-side entitlements.
- Record consent/terms/price versions accepted and provide customer support/audit workflows.

### Functions
- EmailSubscriptionService
- ConfirmationTokenService
- UnsubscribeService
- SuppressionSync
- LegalDocumentRegistry
- PlanCatalog
- BillingProvider (only if approved)
- BillingWebhookHandler
- EntitlementService
- BillingReconciler

### Unit tests
- Marketing consent is separate from download and transactional email.
- Unconfirmed subscriptions cannot receive marketing; unsubscribe and suppression are immediate/idempotent.
- Tokens expire, are purpose-bound, and cannot be replayed or used across sites/lists.
- Published price versions are immutable and only effective versions are offered.
- Entitlement state and webhook handling are idempotent for duplicates and out-of-order events.

### Playwright tests
- Subscribe with explicit opt-in, confirm via test mailbox, and unsubscribe without login.
- Verify unsubscribe link previews/scanners do not unsubscribe on GET and no later campaign is sent.
- Inspect approved terms, effective dates, pricing disclosure, and acceptance records.
- If approved: complete sandbox checkout, cancel, simulate past-due, and verify entitlements update.

### Black-box tests
- Prevent address enumeration, implicit opt-in, forged consent, cross-site/list token use, and post-unsubscribe sends.
- Reject forged/replayed billing webhooks, client-tampered prices, cross-tenant access, and privileges after cancellation/suspension.

### Regression tests
- Download remains available without newsletter consent.
- Legal or marketing consent changes do not alter content publishing or site isolation.
- Billing failures do not accidentally grant paid entitlements or disrupt unrelated sites.

### Fix loop
- Fix consent, suppression, disclosures, billing reconciliation, or entitlement failures and repeat affected tests plus adjacent regressions.

### Audit
- Privacy/legal review purpose, proof of consent, terms, retention/suppression, jurisdictions, refunds and tax disclosures.
- Finance/security/operations review price approval, provider security, webhook controls, reconciliation, incident response, and customer support.

### Exit gate
- Applicable decisions are approved: D-18/D-19 for reader marketing and legal notices; D-19/D-20/D-21 for paid customer billing.
- Only approved terms and effective price versions are presented; no unapproved prices or legal claims appear.
- Unsubscribe/suppression is proven; if paid billing is enabled, sandbox billing, reconciliation, cancellation, and entitlement checks pass.
- Production email marketing and payment processing each have explicit release approval.

---

## 4. Global audit checklist

For every phase, audit the following:

- Security: SSRF, prompt injection, credential leakage, auth bypass, unsafe file parsing
- Privacy: lead PII, retention, token handling, consent enforcement
- Data isolation: cross-site access, stale cache, shared config leakage
- Provider compatibility: schema parity, retries, cost, latency, fallback
- Operational reliability: queue stability, recovery, rollback, backup, observability
- Quality: accuracy, evidence, citations, anti-hallucination controls

If any of these are weak, the phase is not complete.

---

## 5. Required issue structure for each task

Each task should include:

- Phase
- Requirement
- Function(s) to implement
- Unit tests required
- Playwright tests required
- Black-box tests required
- Regression tests required
- Fix actions
- Audit questions
- Exit criteria

This makes every step testable and auditable.

---

## 6. Definition of done for each task

A task is done only when:

- implementation is complete
- unit tests pass
- Playwright tests pass
- black-box validation passed
- regression suite passed
- defects were fixed and re-tested
- a specific audit was performed
- no critical or high-severity gaps remain open

---

## 7. Final rule

Do not advance to the next phase until the current phase is proven by observed execution.

The real sequence is:

Task -> Function -> Unit -> Playwright -> Black-box -> Regression -> Fix -> Audit -> Repeat -> Next phase

That is the end-to-end implementation and validation framework for this platform.
