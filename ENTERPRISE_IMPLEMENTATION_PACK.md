# Centralized Multi-Site Publishing Platform
# Enterprise Implementation Pack

**Document status:** Controlled implementation baseline — approval required  
**Version:** 1.0  
**Audience:** Product, engineering, security, privacy/legal, QA, SRE/operations, migration owners  
**Purpose:** Establish a governed, executable implementation sequence with explicit decisions, phase-level work, test evidence, audit loops, and production gates.

> This pack is designed to make implementation executable without pretending that business or production decisions have already been approved. Proposed defaults below are recommendations, not approvals. Any gate marked **Blocked pending decision** must remain disabled until its owner signs off.

---

## 1. Executive summary

The project goal is to operate one central publishing control plane and content pipeline for independently branded websites. It must protect site boundaries, preserve source provenance and rights, generate evidence-linked drafts, enforce deterministic publication gates, and migrate domains without losing URL or operational continuity.

### Current readiness assessment

- **Architecture direction:** Established.
- **High-level phase and test discipline:** Established.
- **Code-level contracts:** Drafted in [TECHNICAL_SPECIFICATION.md](./TECHNICAL_SPECIFICATION.md).
- **Enterprise operating decisions:** Several remain pending approval.
- **Implementation repository:** The current workspace has a Next.js public-interface prototype using synthetic data. It does not contain the publishing-platform API, admin system, data layer, or workers. Confirm repository ownership and target before production implementation.
- **Production readiness:** Not approved. No production integration or cutover is authorized by this plan.

This pack is therefore **ready for a formal discovery and decision-signoff kickoff**, not an unconditional production build authorization.

### Document control

| Field | Value |
|---|---|
| Document owner | Assign project sponsor |
| Engineering approver | Assign before implementation kickoff |
| Security approver | Assign before processing non-public data |
| Privacy/legal approver | Assign before collecting leads or processing regulated data |
| QA approver | Assign before vertical-slice exit |
| Operations approver | Assign before production-readiness gate |
| Effective date | Date of approval |
| Review cadence | Every phase gate and material contract/architecture change |

Until the named owners approve this document and its decision register, it is a proposed baseline, not an approved enterprise standard.

---

## 2. Scope and success measures

### 2.1 V1 scope

1. Admin identity, roles, and site-scoped authorization.
2. Site registry and fail-closed hostname resolution.
3. Independent kill switches for ingestion, AI generation, and publishing.
4. Authorized PDF intake, rights state, checksum, provenance, extraction, and evidence chunks.
5. One selected AI provider behind a normalized adapter contract.
6. Structured draft, claim-evidence links, citations, quality checks, and human review.
7. One staging destination and public-rendering path.
8. Retry-safe publishing, destination verification, audit trail, and rollback rehearsal.
9. Whitepaper request, email verification, short-lived one-time download authorization.
10. One low-risk WordPress pilot only after staging acceptance.

### 2.2 Explicitly deferred

- Multiple production AI providers
- Bulk migration of all domains
- Arbitrary user-written HTML, scripts, or theme code
- Auto-publish for unresolved rights or unsupported/conflicting claims
- Production cutover before a domain-specific approval
- SaaS billing or unrelated monetization features

### 2.3 Measurable success criteria

The initial slice succeeds only when the team demonstrates in an isolated staging environment:

- A permitted admin can create and activate a staging site configuration without a code deployment.
- Unknown hostnames and unauthorized site requests fail closed.
- A permitted source file is ingested with server-computed SHA-256, rights state, provenance, and page-aware evidence.
- Invalid, malicious, duplicate, or rights-ineligible inputs follow their defined reject/quarantine/review path.
- The selected provider returns a schema-valid draft whose material claims and citations resolve to stored evidence.
- Hard quality failures block publishing; human approval cannot override non-overridable failures.
- A staging publish retry results in one destination article and a verified remote outcome.
- Public rendering uses the correct site identity, canonical URL, metadata, and published revision.
- Email verification precedes a short-lived, one-use download authorization.
- Site isolation, kill switches, logs, restore, and rollback are exercised and evidenced.

Numeric latency, availability, volume, cost, retention, RPO, and RTO targets are not invented here; they require business/operations approval in Section 4.

---

## 3. Proposed architecture baseline

Use the detailed contracts and schemas in [TECHNICAL_SPECIFICATION.md](./TECHNICAL_SPECIFICATION.md) as the engineering reference, subject to the decisions below.

### 3.1 Proposed system shape

- TypeScript modular monolith for API/domain services.
- Separately runnable background workers.
- Next.js admin and multi-domain public renderer. Public pages must use server rendering or static generation/revalidation appropriate to approved freshness requirements, with server-generated metadata, canonical URLs, robots policy, sitemap, and structured data. The current Next.js public catalog is a synthetic-data prototype, not the production renderer.
- Versioned REST API with runtime request/response validation.
- MongoDB for metadata and workflow state.
- Redis/BullMQ for asynchronous execution; durable application state remains in MongoDB.
- Private object storage for originals and extracted content.
- PDF processing isolated in a restricted worker.
- Provider and destination adapters behind application-owned interfaces.

These are recommended defaults, not vendor procurement decisions. Validate hosting, compliance, team skills, existing systems, and cost before stack lock.

### 3.2 Publishing authority policy

**Proposed default:** WordPress remains authoritative for a domain until a domain-specific cutover is approved. The new platform initially publishes only to a staging destination. At all times, exactly one system is authoritative for production publishing on a given domain.

**Hard control:** production publisher adapters remain disabled until a signed domain cutover record names the authoritative system, owner, date, verification procedure, and rollback path.

### 3.3 AI provider policy

**Proposed default:** integrate one provider for the vertical slice. Do not silently fail over between providers. Persist provider/model/contract/prompt versions and usage metadata. Add other major vendors only after the common contract and evaluation suite pass and data-handling/cost approval is complete.

### 3.4 Rights policy

| Rights state | Ingest for review | Extract | Generate draft | Auto-publish |
|---|---:|---:|---:|---:|
| `unknown` | Yes, if authorized | Yes, if permitted by policy | No by default | No |
| `review_required` | Yes | Yes, if permitted by policy | Hold for approved workflow | No |
| `allowed` | Yes | Yes | Yes | Only if every other gate passes |
| `blocked` | Quarantine/record only | No | No | No |
| `expired` | Preserve audit record | No new processing | No | No |

Legal/privacy owners must approve the operational meaning of each state and any jurisdiction-specific exceptions before production.

---

## 4. Decision register — mandatory sign-off

Each decision needs a named owner, decision date, rationale, and affected documents/configuration. Until approved, use the conservative development-only default and do not enable the production capability.

| ID | Decision | Proposed default | Owner | Gate |
|---|---|---|---|---|
| D-01 | Which repository is the platform implementation target? | Confirm ownership/repository audit first; current workspace now contains a Next.js public-interface prototype but lacks the production platform | Engineering lead | Before Phase 1 |
| D-02 | Authoritative publisher per domain? | Legacy WordPress until domain cutover; staging platform only before approval | Product + web operations | Before any production publish |
| D-03 | First production-like domain and staging hostname? | One low-risk site, non-production hostname | Product + operations | Before vertical slice |
| D-04 | Rights taxonomy and allowable uses? | Unknown/review/blocked/expired cannot auto-publish | Legal/content owner | Before source workflow |
| D-05 | Initial AI vendor/model and data-processing terms? | One provider selected after privacy/security/procurement review | AI owner + security/legal | Before live generation |
| D-06 | Identity provider, MFA, session model, admin roles? | OIDC-capable enterprise identity with MFA; exact provider TBD | Security + IT | Before admin access |
| D-07 | Lead identity scope and consent basis? | Per-site identity; separate transactional and marketing consent | Privacy/legal + product | Before public lead capture |
| D-08 | Retention and deletion periods for each data class? | No production PII collection until policy is approved | Privacy/legal + data owner | Before lead capture |
| D-09 | Expected traffic, PDF sizes/pages, article volume, AI spend ceiling? | Define from domain analytics and business forecast | Product + finance + SRE | Before capacity design |
| D-10 | Availability SLO, RPO, RTO, support window? | Establish service tiers with business owners; no assumed guarantee | Product + SRE | Before production launch |
| D-11 | Hosting, region, network boundaries, backup provider? | User specified a dedicated application VPS with 8 vCPU/8 GB RAM; provider, region, data residency, and backup topology remain open | Architecture + security | Before infrastructure procurement |
| D-12 | WordPress cutover, redirect and DNS authority? | Domain-by-domain freeze, reversible cutover | Migration + operations | Before pilot cutover |
| D-13 | Public rendering and SEO delivery model? | Next.js App Router with server rendering or static generation/revalidation, server-generated metadata, canonical policy, sitemap and robots rules | Engineering + SEO owner | Before renderer implementation |
| D-16 | Initial deployment topology and single-node risk acceptance? | Application containers on the specified 8-vCPU/8-GB VPS; keep MongoDB, Redis, and object storage external/private where approved; the VPS remains a single application-node failure domain | Architecture + security + SRE + sponsor | Before capacity test and production infrastructure approval |
| D-18 | Reader email subscription purpose, consent, confirmation, unsubscribe, and retention? | Separate explicit marketing opt-in; double opt-in pending approval | Product + privacy/legal + email operations | Before collecting newsletter subscriptions or sending marketing |
| D-19 | Which customer-facing terms, privacy/cookie notices, and paid-subscription conditions apply? | Counsel-approved, versioned documents; no legal copy inferred | Legal/privacy + product + sponsor | Before public launch or paid sales |
| D-20 | What pricing, currencies, billing, tax, trials, cancellation, refunds, and price-change rules apply? | No public price or paid checkout until formally approved | Product + finance + legal + sponsor | Before advertising or charging for a plan |
| D-21 | Is this internal single-tenant software or multi-customer SaaS, and what entity owns each subscription? | Resolve tenant/customer boundary before billing implementation | Sponsor + product + architecture + security/legal | Before customer billing or tenant onboarding |
| D-22 | Is the product an owned multi-site publisher, a vendor-facing whitepaper hosting/syndication/lead-generation service, or a hybrid? | User-selected direction: owned multi-site publisher. Keep vendor onboarding, paid syndication campaigns, and vendor lead delivery out of scope unless separately approved. Formal scope approval remains pending. | Sponsor + product + editorial + privacy/legal | Before enabling any vendor-facing onboarding, campaign lead delivery, or paid services |

### Decision record template

```text
Decision ID:
Question:
Chosen option:
Rejected options:
Rationale:
Owner / approver:
Date:
Affected systems/domains:
Security/privacy impact:
Rollback or reconsideration trigger:
```

---

## 5. Governance, roles, and change control

### 5.1 Required ownership

| Role | Accountable for |
|---|---|
| Product owner | Scope, user outcomes, priority, business acceptance |
| Engineering lead/architect | Architecture, interfaces, implementation sequencing |
| Security owner | Threat model, security controls, findings, exception approval |
| Privacy/legal owner | Rights, consent, data processing, retention/deletion requirements |
| QA lead | Test strategy, test evidence, release quality gate |
| SRE/operations owner | Environments, SLOs, monitoring, backups, incident and rollback readiness |
| Content/editorial owner | Editorial profile, human review, evidence and attribution policy |
| Migration owner | WordPress exports, URL maps, cutover and rollback |

One person may hold multiple roles in a small team, but the responsibilities and approvers must still be named. A person cannot approve their own high-risk security exception.

### 5.2 Change control

- One issue/behavior change per pull request where practical.
- Every PR links to an issue, acceptance criteria, affected contracts, and test evidence.
- Changes to rights policy, provider/data handling, auth, site boundaries, download tokens, publishing authority, or migrations require designated owner review.
- Schema and API changes require compatibility notes and migration/backfill plans.
- Production actions require an approved change record and rollback plan.
- No production service start/stop/restart, migration, or cutover is implied by this documentation.

### 5.3 Architecture decision records

Record material decisions as ADRs, including: context, decision, alternatives, consequences, owner, date, affected components, and revisit triggers. At minimum create ADRs for D-02, D-04, D-05, D-06, D-08, D-10, and D-11.

---

## 6. Phase execution plan and mandatory quality loop

Every task uses:

**Task → function/interface → unit test → Playwright test (when UI applies) → black-box test (when boundary applies) → regression → fix → audit → repeat.**

Test applicability is explicit. A test type that does not apply must include a brief reason; it is not silently skipped. Phase exit requires all applicable tests to pass, defects to be fixed or formally risk-accepted, and evidence to be recorded.

### Phase 0 — Discovery and target confirmation

**Objective:** Establish actual system facts and resolve implementation-target ambiguity.

**Tasks / functions**
- Inventory target repositories, workspaces, deployment, scripts, models, routes, helper functions, and integrations.
- Inventory domains, DNS/hosting, WordPress plugins/content types, URLs, analytics, traffic, and ownership.
- Record baseline build/test failures without modifying existing behavior.
- Produce decision records and risk register.
- Confirm design/brand owners, existing visual references, required content templates, and admin user workflows.
- Inventory every required external integration, account owner, environment, permission, data flow, rate limit, and failure mode.
- **Functions/artifacts:** `RepositoryInventory`, `EnvironmentInventory`, `DomainInventory`, `BaselineTestReport`, `DecisionRegister`, `UIWorkflowInventory`, `IntegrationInventory`.

**Tests**
- Unit: validate inventory schema and required fields if inventory is automated.
- Playwright: not applicable; discovery only.
- Black-box: run existing documented build/test flows and verify observable staging behavior where authorized.
- Regression: capture baseline checks and existing known failures.

**Fix/audit/repeat**
- Correct factual errors and missing inventory; repeat checks until repo/system map is reviewed by engineering and operations.
- Audit missing owners, production access assumptions, undocumented secrets, and destructive migration risks.

**Exit:** D-01 is resolved; baseline and blockers are accepted by owners. No feature implementation begins against an unconfirmed target.

### Phase 1 — Decisions, threat model, and secure foundation

**Objective:** Approve the minimum controls required before data processing.

**Tasks / functions**
- Approve site roles and permission matrix: `PermissionEvaluator`.
- Implement identity adapter and site-scoped context: `AuthContext`, `AuthMiddleware`.
- Implement hostname registry/normalization: `SiteRegistry`, `HostResolver`.
- Implement global and per-site controls: `KillSwitchService`.
- Implement append-only audit and correlation: `AuditLogger`, `CorrelationContext`.
- Validate config and secret references at startup: `ConfigLoader`, `SecretProvider`.
- Define collections/indexes and migration policy: `DatabaseBootstrap`.
- Establish frontend foundation: Next.js App Router, semantic layout, design tokens, accessible UI primitives, route boundaries, and server/client component rules.
- Establish integration registry: adapter lifecycle, connection-test policy, health states, secret references, and disable/rotation behavior.

**Tests**
- Unit: permission matrix, hostname normalization, unknown-host rejection, kill switch behavior, redaction.
- Playwright: admin sign-in, role-denied route, create draft site, change kill switch if UI exists.
- Black-box: cross-site IDOR attempts, unknown/ambiguous host, disabled feature action returns safe denial.
- Regression: existing routes and build remain functional; baseline deviations are recorded.

**Fix/audit/repeat**
- Fix every cross-site access, auth bypass, missing audit record, or unsafe default; rerun affected tests and security checks.
- Audit every repository and route for required site scope; verify public and admin trust boundaries separately.

**Exit:** identity/site policy approved; cross-site tests pass; kill switches work server-side; no critical/high unresolved finding.

### Phase 2 — Source intake, rights, and evidence

**Objective:** Safely process one authorized source and provide traceable evidence.

**Tasks / functions**
- Upload/URL intake: `SourceIngestionService`.
- URL/DNS/redirect policy: `SafeFetchPolicy`.
- checksum, dedupe, private storage: `SourceAssetService`.
- isolated extraction: `PdfExtractionWorker`.
- page-aware chunking and provenance: `EvidenceChunkBuilder`.
- rights state transitions and operator review: `RightsPolicyService`.
- quarantine and retry state: `SourceLifecycleService`.

**Tests**
- Unit: limits, file signatures, hashes, duplicate behavior, rights transitions, URL policy, page mapping.
- Playwright: authorized upload, status visibility, evidence review, quarantine message.
- Black-box: malformed file, oversized file, blocked network address, redirect revalidation, duplicate upload, rights-denied source.
- Regression: valid authorized PDF retains expected page count/hash/evidence references.

**Fix/audit/repeat**
- Fix parser/fetch defects; rerun malicious fixtures and valid corpus.
- Audit worker isolation, object ACLs, SSRF defenses at connection time, rights enforcement, and deletion behavior.

**Exit:** valid and invalid fixtures follow expected states; evidence is traceable; rights cannot be bypassed.

### Phase 3 — One-provider draft generation and quality gates

**Objective:** Produce a schema-valid, reviewable draft without granting a model authority to publish.

**Tasks / functions**
- Provider contract and selected adapter: `DraftProvider`.
- Prompt and contract versioning: `PromptRegistry`.
- evidence selection and bounded context: `EvidenceContextBuilder`.
- output parse/schema validation: `DraftValidator`.
- claims/citations: `ClaimEvidenceService`, `CitationValidator`.
- hard-gate evaluation: `QualityGateEngine`.
- evaluation corpus runner: `AiEvaluationRunner`.

**Tests**
- Unit: response schema, citation references, claim status, hard-gate truth table, timeout classification.
- Playwright: request generation, inspect draft/evidence, edit, view gate failures.
- Black-box: unsupported claim, fabricated citation, conflicting source, prompt injection, empty/invalid provider response, provider outage.
- Regression: fixed evaluation corpus results; previously approved revisions remain immutable and auditable.

**Fix/audit/repeat**
- Fix contract or policy failures; rerun entire corpus after prompt, model, provider, or policy changes.
- Audit data handling, provider terms, prompt injection defenses, cost bounds, and human-review workflow.

**Exit:** selected provider passes contract/evaluation criteria; any unresolved required evidence blocks eligibility; provider/model/prompt versions are recorded.

### Phase 4 — Editorial review, preview, and staging publication

**Objective:** Prove one complete controlled publishing path.

**Tasks / functions**
- immutable revisions: `ArticleRevisionService`.
- review/approval transitions: `EditorialWorkflowService`.
- typed rich-text rendering: `ContentRenderer`.
- SEO/canonical policy: `MetadataBuilder`.
- idempotent jobs: `PublishJobService`.
- destination verification/reconciliation: `DestinationReconciler`.
- rollback: `StagingRollbackService`.
- Build initial admin screens using the approved design system: dashboard, source/evidence review, article editor, quality report, publishing job details, and theme preview.
- Implement loading, empty, validation, permission-denied, conflict, paused, and dependency-unavailable states for the complete path.

**Tests**
- Unit: state transitions, immutable revisions, idempotency, remote verification, metadata.
- Playwright: review, approve, preview, publish to staging, inspect job, retry same operation.
- Black-box: duplicate request, worker crash/partial success, destination unavailable, gate changes after enqueue, kill switch activated mid-workflow.
- Regression: published page, canonical metadata, and existing site configuration.

**Fix/audit/repeat**
- Fix duplicates, stale approvals, metadata mismatch, or failed reconciliation; rerun the end-to-end path.
- Audit publisher authority, destination credentials, quality recheck before side effect, and rollback proof.

**Exit:** a single verified staging publication is repeatable, auditable, and reversible. Production publishing remains disabled.

### Phase 5 — Lead capture and protected download

**Objective:** Prove consent-aware verification and one-time download behavior.

**Tasks / functions**
- lead request and normalization: `LeadCaptureService`.
- verification dispatch: `EmailVerificationService`.
- hashed one-time token issuance/redemption: `DownloadAuthorizationService`.
- consent and retention: `ConsentService`, `RetentionWorker`.
- abuse limits: `RateLimitPolicy`.

**Tests**
- Unit: email normalization, token hash/expiry, atomic redemption, consent distinction, retention deletion.
- Playwright: request, email interception, verify, download, repeat redemption denied.
- Black-box: enumeration resistance, replay/race attempts, expired/tampered token, cross-site token, rate limit, email provider outage.
- Regression: normal lead conversion and article workflows.

**Fix/audit/repeat**
- Fix replay, enumeration, consent, or deletion gaps; rerun race tests and public flow.
- Audit PII minimization, email delivery, retention, deletion from backups, and logs.

**Exit:** privacy/legal decisions signed; no replay/enumeration issue; retention/deletion validated.

### Phase 6 — Multi-site expansion and integrations

**Objective:** Add additional sites only after single-site isolation is proven.

**Tasks / functions**
- 36 site design preset definitions across six families, built on shared page templates, design tokens, and components: `ThemeRegistry`.
- multi-host resolution: `SiteResolver`.
- site-partitioned caching: `CacheKeyBuilder`, `CacheInvalidator`.
- SEO/sitemap: `SitemapService`.
- analytics adapter and per-site secret refs: `AnalyticsConnector`.
- Deliver the shared public/admin template library, initial design system, responsive states, accessible dialogs, and site-level theme preview/publish/rollback workflow.
- Approve six representative presets first (one per family), then configure and validate the other five presets per family. The catalog contract and test harness must support all 36 from the start.
- Add integration adapters one at a time, each with configuration validation, safe connection test, health status, disable/rotation behavior, contract tests, and provider-specific failure tests.

**Tests**
- Unit: preset registry/versioning/template compatibility, theme schema, cache key partitioning, canonical/robots policy, integration scope.
- Playwright: same content model with distinct site brands; all preset desktop smoke renders; representative template × family responsive cases; sitemap and metadata checks; dialog keyboard/focus behavior.
- Black-box: hostname mismatch, cache poisoning/cross-site stale data, credentials unavailable to browser, analytics isolation, preview authorization.
- Regression: original vertical slice remains valid with additional site configured.

**Fix/audit/repeat**
- Fix isolation/metadata/credential defects; repeat two-site acceptance tests.
- Audit public cache keys, preview access, secret boundaries, and domain deactivation behavior.
- Review theme/template matrix at mobile, tablet, desktop, long-content, empty/error, and accessibility states.
- Review all visual-diff reports; test six representative presets manually for accessibility and require automated accessibility/rendering checks for all 36. Production assignment requires each preset's approved lifecycle status and D-17 design/brand review evidence.

**Exit:** all 36 preset entries are versioned, discoverable, previewable, schema-valid, and pass rendering smoke checks; six representative family presets pass visual/accessibility review; production assignments use only individually approved presets; at least two isolated staging sites pass; no new site requires a separate app deployment.

### Phase 7 — WordPress pilot, cutover rehearsal, and rollback

**Objective:** Validate migration in a non-production rehearsal before any real cutover.

**Tasks / functions**
- read-only export: `WordPressExporter`.
- content/metadata mapping: `MigrationMapper`.
- URL map and redirect checks: `RedirectValidator`.
- reconciliation report: `ContentReconciler`.
- cutover/rollback checklist: `CutoverController` (manual approval required).

**Tests**
- Unit: mapping determinism, duplicate handling, redirect status, content parity tolerances.
- Playwright: migrated page path, redirects, canonical, metadata, media and navigation.
- Black-box: compare old/new URLs, simulate rollback, verify single publisher authority.
- Regression: non-pilot sites and staging publishing remain unaffected.

**Fix/audit/repeat**
- Fix URL/content/analytics discrepancies; repeat export/import and rollback rehearsal.
- Audit backup, DNS control, content freeze/delta plan, analytics continuity, and sign-off chain.

**Exit:** pilot owner approves measured parity and rollback evidence. Production cutover requires a separate change approval.

### Phase 8 — Operational readiness and controlled rollout

**Objective:** Demonstrate recovery, observability, capacity, and release controls.

**Tasks / functions**
- SLO and alert definitions: `ServiceLevelCatalog`.
- load/resilience validation: `CapacityTestSuite`.
- backup and restore: `RestoreRunbook`.
- incident and escalation: `IncidentRunbook`.
- release evidence: `ReleaseGate`.
- staged rollout and kill-switch rehearsal: `RolloutController`.

**Tests**
- Unit: alert thresholds and release gate rules.
- Playwright: operational dashboard and feature pause control.
- Black-box: worker/storage/provider outage, queue backlog recovery, restore, rollback, load/failure scenarios.
- Regression: full critical user journeys on release candidate.

**Fix/audit/repeat**
- Fix all critical/high issues; repeat affected tests and full release gate.
- Independent security/privacy/operations review; document accepted residual risks and owners.

**Exit:** SLOs, RPO/RTO, support ownership, restore evidence, alerts, rollback, and production approvals are recorded. Rollout can then be separately authorized.

### Phase 9 — Email subscriptions, legal terms, and commercial plans

**Objective:** Add independently consented reader email subscriptions for the owned sites. Paid platform subscriptions, vendor onboarding, syndication services, and lead delivery are not part of the selected product scope; add them only after D-20 through D-22 are formally approved. Newsletter opt-in is not a download condition, account requirement, paid-plan condition, or substitute for terms acceptance.

**Tasks / functions**
- Reader list lifecycle: `EmailSubscriptionService`, `ConfirmationTokenService`, `UnsubscribeService`, `SuppressionSync`.
- Versioned legal copy and consent evidence: `LegalDocumentRegistry`, `ConsentEvidenceService`.
- Approved public plan catalog and immutable price versions: `PlanCatalog` (no amount or terms are assumed by this plan).
- Paid billing only if D-20/D-21 approve: `BillingProvider`, `BillingWebhookHandler`, `EntitlementService`, `BillingReconciler`.
- Customer self-service cancel/portal, invoice references, retention, and support/audit workflows.

**Tests**
- Unit: consent-purpose separation, subscription state transitions, token expiry/idempotency, suppression, price-version immutability, entitlement evaluation, webhook deduplication.
- Playwright: newsletter opt-in and confirmation, one-click unsubscribe without login, legal/privacy/pricing disclosure, and (if approved) sandbox checkout, cancellation, billing state, and entitlement changes.
- Black-box: email enumeration, unconfirmed marketing send, unsubscribe link scanning, cross-site/list misuse, forged/replayed webhook, price tampering, cross-tenant access, and access after cancellation/suspension.
- Regression: download remains usable without marketing opt-in; legal/consent changes do not alter published content or site isolation.

**Fix/audit/repeat**
- Fix consent, suppression, legal disclosure, billing reconciliation, and entitlement defects; repeat affected flows and regression suites.
- Privacy/legal review subscription purposes, proof of consent, retention/suppression, terms versions, cancellation, refunds, tax/price disclosures, and jurisdictions.
- Finance/security/operations review price approvals, billing provider, webhook signature/idempotency, reconciliation, incident handling, and customer support.

**Exit:** applicable decisions are approved (D-18/D-19 for reader marketing and legal notices; D-20/D-21/D-22 before any future paid customer or vendor-facing services); legal content and any effective price versions have named approvers; unsubscribe/suppression and (if explicitly enabled) billing/entitlement flows pass tests and independent review. No paid plan or vendor campaign service may be advertised or charged before explicit approval.

### Phase-to-requirement traceability

Assign stable requirement IDs in the project tracker and connect each requirement to implementation, tests, audit ownership, and a phase gate. These starter rows are not the full requirements register.

| Requirement ID | Requirement | Implementation area | Required evidence | Audit owner | Gate |
|---|---|---|---|---|---|
| SEC-SITE-001 | Site-scoped authorization | Auth middleware and scoped repositories | Permission tests and black-box cross-site denial | Security | Phase 1 |
| SITE-HOST-001 | Unknown host fails closed | Host resolver | Host normalization tests and black-box denial | Engineering/Security | Phase 1 |
| OPS-KILL-001 | Independent pause controls | Kill-switch service | Control matrix and black-box pause behavior | Operations | Phase 1 |
| SRC-RIGHTS-001 | Rights-ineligible source cannot auto-publish | Rights policy and quality engine | Rights-state tests and blocked-publish proof | Legal/Content | Phase 2 |
| SRC-EVIDENCE-001 | Evidence retains source/page lineage | Extraction and evidence modules | Fixture tests and reviewer UI evidence | Content/QA | Phase 2 |
| AI-CONTRACT-001 | Provider output conforms to contract | AI adapter and schema validator | Contract suite and evaluation-corpus report | AI/QA/Security | Phase 3 |
| PUB-IDEMP-001 | Publish retry creates one destination item | Publisher and reconciliation | Concurrency test and black-box retry proof | Engineering/QA | Phase 4 |
| DL-TOKEN-001 | Download authorization expires and is one-use | Download authorization service | Atomic redemption and replay-denial proof | Security/Privacy | Phase 5 |
| SEO-SSR-001 | Public response has correct SEO metadata | Next.js public renderer | Metadata contract and rendered HTML checks | SEO/QA | Phase 6 |
| MIG-ROLL-001 | Pilot migration rollback is verified | Migration workflow and runbook | Reconciliation report and witnessed rehearsal | Operations/Migration | Phase 7 |

The approved register must additionally contain source, priority, owner, acceptance threshold, current status, evidence location, and change history for every requirement.

---

---

## 7. Test evidence and defect workflow

### 7.1 Evidence required per issue

Each issue/PR records:

- requirement and measurable acceptance criteria
- affected modules, APIs, data collections, and trust boundaries
- tests added/changed and exact commands executed
- actual observed test outcome; no inferred or proxy passes
- screenshots/video for UI changes where useful
- black-box setup, fixture IDs, and expected/actual result
- defects found, severity, root cause, fix commit/PR, and retest evidence
- audit reviewer and any accepted residual risk

### 7.2 Severity and handling

| Severity | Handling |
|---|---|
| Critical | Stop phase/release; mitigate immediately; independent review and retest required |
| High | Block phase/release unless formal risk acceptance by accountable owner and security |
| Medium | Fix before affected capability is enabled or schedule with owner/date and compensating control |
| Low | Track with owner and planned disposition; does not silently disappear |

No test failure may be waived by changing the expected result without a reviewed requirement change.

### 7.3 Repeat loop

```text
Run checks
  -> record failure and reproduction
  -> classify severity and root cause
  -> implement minimal root-cause fix
  -> rerun failed test
  -> rerun adjacent unit/integration/UI tests
  -> rerun trust-boundary black-box tests where applicable
  -> rerun regression suite
  -> audit for same failure pattern elsewhere
  -> repeat until clean or formally blocked
```

---

## 8. Enterprise security and privacy controls

### 8.1 Security assurance

- Maintain a threat model covering SSRF, parser compromise, prompt injection, account compromise, cross-site IDOR, credential theft, replay, duplicate publication, data loss, and provider outage.
- Use least privilege for users, service accounts, storage, database, and provider keys.
- Run dependency and secret scanning in CI; define remediation SLAs by severity.
- Require security review for auth, fetch, parsing, publishing, download, integrations, and migration changes.
- Use isolated staging data; do not copy production lead PII into development or test.
- Record security exceptions with scope, owner, expiry, compensating control, and approver.

### 8.2 Privacy/data classification

| Class | Examples | Minimum handling |
|---|---|---|
| Public | Published article, public metadata | Integrity and change controls |
| Internal | Site configs, operational reports | Authenticated access, audit |
| Confidential | Source files, drafts, rights evidence | Private storage, scoped access, retention |
| Restricted PII/secret | Email, verification token, credentials | Minimize, encrypt/hash as applicable, strict access, no logs |

Legal/privacy owners must determine applicable jurisdictional obligations, lawful basis, user notices, data-subject workflows, and retention. This plan is not legal advice or a compliance certification.

### 8.3 Data lifecycle register

Production collection or processing remains blocked until each applicable row has an approved retention period, deletion trigger, owner, and backup treatment.

| Data class | Examples | Storage boundary | Required decision | Verification |
|---|---|---|---|---|
| Source originals | Uploaded/fetched PDFs | Private object storage | Retention, rights hold, deletion | Object and DB reference removal |
| Extracted evidence | Text chunks, hashes, page references | Private storage + metadata DB | Retention and source deletion propagation | Search/index/cache/object removal |
| Drafts/revisions | Article text, citations, review records | Site-scoped DB | Editorial retention and archive behavior | Revision lifecycle tests |
| Leads | Email, consent, verification state | Restricted PII store | Lawful basis, retention, deletion SLA | End-to-end deletion exercise |
| Tokens | Verification/download token hashes | Restricted DB | TTL and audit retention | Expiry, redemption, revocation tests |
| Audit/security logs | Actor, action, site, correlation | Restricted log store | Retention, access, legal hold | Retention job and access audit |
| Provider telemetry | Provider/model, usage/cost, failures | Operational store | Vendor/privacy retention approval | Aggregation and deletion check |

Deletion must account for primary databases, object storage, indexes/caches, exports, and backup expiry. A TTL index alone is not a complete deletion control.

### 8.4 Recovery and continuity

Before production, define:

- RPO and RTO by service/data class
- backup cadence, encryption, immutability, and retention
- restore ordering for database, object storage, queue state, and secrets
- acceptable data loss and reconciliation steps
- recovery owner, escalation route, and evidence capture

Test restores from backups; backup-job success alone is not proof of recoverability.

---

## 9. SRE, release, and operational standards

### 9.1 SLOs to approve

Set separate objectives for:

- public rendering availability and latency
- admin/API availability and latency
- publishing job completion and queue age
- PDF extraction completion
- email verification delivery
- restore and incident recovery

Do not publish a 99.5% or other availability promise until the service boundary, measurement window, exclusions, and alerting are agreed.

### 9.2 Required operational dashboards

- request rate, error rate, latency by route/service
- queue depth, oldest job, retry and dead-letter counts
- source fetch/extraction outcomes
- AI provider latency/errors/cost by model and site
- quality gate failures by reason
- publication verification and reconciliation outcomes
- lead verification/download completion and abuse counters
- site availability and cache behavior

### 9.3 Release gates

Every production release must have:

- approved change record and release owner
- artifact/version and database migration compatibility
- required unit/integration/E2E/security tests observed green
- open defect and risk acceptance list
- backup/restore evidence when data or schema changes
- rollback/kill-switch plan and accountable operator
- monitoring and alert confirmation
- domain/publisher scope confirmation

---

## 10. GitHub execution model

### 10.1 Issue types

- Epic: multi-issue outcome; has owner and phase gate.
- Feature/task: one reviewable behavior or interface.
- Security: trust-boundary change, threat, or remediation.
- Test: evaluation corpus, automation, or reliability test.
- Decision: ADR or business/operational approval.
- Bug: reproducible defect with expected/actual behavior.

### 10.2 Required issue template

```markdown
## Outcome
What user/system behavior changes?

## Scope / non-scope
List included and excluded behavior.

## Contracts and data impact
APIs, schemas, collections, events, jobs, migrations.

## Acceptance criteria
- [ ] Observable and measurable outcome

## Tests
- [ ] Unit
- [ ] Integration
- [ ] Playwright (or N/A with reason)
- [ ] Black-box (or N/A with reason)
- [ ] Regression

## Security / privacy / rights
Threats, PII, secrets, rights, retention, required reviewer.

## Rollback / recovery
How to disable or reverse this behavior.

## Evidence
Commands, environment, observed outcomes, report links.
```

### 10.3 Definition of Ready

- decision dependencies are resolved
- scope and acceptance criteria are testable
- dependencies and owner are known
- API/data/security impact is identified
- implementation target and environment are confirmed

### 10.4 Definition of Done

- behavior implemented and documented
- relevant tests actually executed and observed
- audit/gap review completed
- defects fixed and retested or formally risk-accepted
- migration/rollback instructions exist where applicable
- required reviewers approve

---

## 11. Capacity and schedule

The earlier sprint counts are planning placeholders, not a delivery commitment. Do not assign calendar duration until repository discovery, staffing, domain complexity, vendor procurement, hosting, and migration effort are known.

Estimate each issue after Phase 0 using:

- effort range and confidence
- dependency/critical path
- reviewer and test environment availability
- external approvals/procurement
- migration window constraints
- risk/unknown allowance

Report delivery using evidence-based milestones (phase gates), not a fixed promise based on an unvalidated sprint count.

---

## 12. Go/no-go checklist

### Engineering kickoff: GO only if

- [ ] Target implementation repository is confirmed.
- [ ] Baseline build/test/deployment state is recorded.
- [ ] Engineering, product, security, privacy, QA, and operations owners are named.
- [ ] Publisher, rights, auth, and first-provider decisions are assigned with due dates.
- [ ] Development/staging boundaries and secret handling are defined.

### Vertical slice: GO only if

- [ ] Site scope and host resolution are approved.
- [ ] One staging domain is available and owned.
- [ ] Authorized PDF fixture and rights evidence are available.
- [ ] Selected provider and processing terms are approved for the data class.
- [ ] Quality-gate policy and human-review path are approved.

### Production: GO only if

- [ ] All blocking decisions in Section 4 are approved.
- [ ] Production publishing authority is explicit per domain.
- [ ] Retention, deletion, privacy notices, and consent are approved.
- [ ] SLO/RPO/RTO and operational ownership are approved.
- [ ] Security/privacy findings meet release policy.
- [ ] Restore and rollback rehearsals pass.
- [ ] Domain-by-domain change record is approved.

---

## 13. Document set and precedence

Use this pack as the enterprise governance and execution index.

- [PROJECT_DECISION_REGISTER.md](./PROJECT_DECISION_REGISTER.md): authoritative decision status and sign-off ledger; open decisions block affected capabilities.
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md): current implemented/pending status and validation evidence for this workspace.
- [DEPLOYMENT_AND_CAPACITY_BASELINE.md](./DEPLOYMENT_AND_CAPACITY_BASELINE.md): proposed topology and resource baseline for the specified 8-vCPU/8-GB dedicated VPS, with capacity and resilience limits.
- [FRONTEND_THEME_AND_INTEGRATION_SPEC.md](./FRONTEND_THEME_AND_INTEGRATION_SPEC.md): clean/professional design system, 36 preset definitions, templates, admin information architecture, dialogs, validation, integration inventory, and UI tests.
- [TECHNICAL_SPECIFICATION.md](./TECHNICAL_SPECIFICATION.md): contracts, schemas, APIs, persistence, security, and test details.
- [END_TO_END_IMPLEMENTATION_TESTING_AUDIT_PLAN.md](./END_TO_END_IMPLEMENTATION_TESTING_AUDIT_PLAN.md): implementation/test/fix/audit loop by phase.
- [GITHUB_ISSUE_BACKLOG.md](./GITHUB_ISSUE_BACKLOG.md): initial issue decomposition; reconcile it with approved decisions before creating GitHub issues.
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md): concise phase sequencing.
- [DEVELOPER_READY_BLUEPRINT.md](./DEVELOPER_READY_BLUEPRINT.md): system overview and foundational domain model.

If documents conflict, use this precedence:
1. Approved ADR and signed business/security/privacy decision
2. Approved entries in the project decision register
3. This enterprise implementation pack
4. Technical specification
5. Backlog and earlier planning documents

Update all affected documents when an approved decision changes a contract.

### 13.1 Required implementation handoff artifacts

Before Phase 1 engineering, publish and version-control:

1. Approved decision register and ADRs, with owner, approver, date, and rationale.
2. Repository/environment baseline with commands and observed results.
3. Requirements register with stable IDs, acceptance criteria, and traceability.
4. Data classification, source-rights matrix, threat model, and retention/deletion schedule.
5. API/schema contracts and compatible migration/backfill plans.
6. Environment topology, access boundaries, secret provisioning, and residency decision.
7. Licensed or synthetic test fixtures and evaluation-corpus ownership.
8. CI, branch protection, dependency/secret scanning, and artifact provenance policy.
9. Runbooks for alerts, kill switches, incident response, restore, and rollback.
10. Domain-specific publishing-authority and cutover records.

Unavailable artifacts must have a blocking issue, accountable owner, and due date. Do not replace them with untracked assumptions.

---

## 14. Final readiness statement

This pack is a **proposed governed enterprise implementation baseline**. It makes the build sequence, ownership, test loop, traceability, audit requirements, and release controls explicit. It is not enterprise-approved until document owners and approvers are named and the decision register is signed. It does not claim that unresolved legal, identity, hosting, data-retention, capacity, SEO, or publishing decisions are already settled.

The current Next.js catalog is a prototype only. Implementation may continue with Phase 0 repository and environment discovery. Phase 1 engineering kickoff requires the target repository and baseline to be confirmed. Production data processing, AI-provider use with non-public data, production publishing, public-domain SEO rollout, and domain cutover remain blocked until their decision gates are approved and recorded.
