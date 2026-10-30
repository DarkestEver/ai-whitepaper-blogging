# Centralized Multi-Site Publishing Platform
# Execution-Ready Delivery Plan

## 1. Planning reset

The earlier plan was too broad and too abstract to execute cleanly. This version is intentionally narrower and more realistic.

The rule is simple:
- build one safe path first
- prove it in staging
- expand only after evidence
- never advance a phase without test evidence and a security review

---

## 2. Delivery model

Use this loop for every phase:

1. Inspect the repository and current implementation
2. Define the exact scope and output
3. Implement the smallest safe change
4. Add tests with the change
5. Run the relevant unit, Playwright, black-box, and regression checks
6. Audit for security, privacy, isolation, and provider compatibility
7. Fix defects and re-run
8. Close the issue only when the evidence is observed and recorded

This is the required execution standard.

---

## 3. Priority order

### Priority 0 — must happen first
- repository and environment audit
- authoritative publisher decision for v1
- rights policy decision
- site kill switches and safe fail-closed behavior
- single AI provider contract for the first vertical slice

### Priority 1 — required before scaling
- secure PDF intake
- evidence and citation validation
- idempotent publish flow
- lead + secure download flow
- audit, backup, and rollback rehearsal

### Priority 2 — only after validation
- additional themes and domains
- multi-provider support
- WordPress migration batches
- broad SEO and analytics expansion

---

## 4. Workstreams

### Workstream A — foundation and governance
- repo and environment review
- auth and RBAC
- site registry and domain scoping
- kill switches
- secrets interface
- audit logs and request correlation

### Workstream B — safe content intake
- authorized PDF intake
- URL validation and SSRF blocking
- dedupe and hash tracking
- extraction and page-aware evidence
- rights state tracking

### Workstream C — AI and quality gates
- select one AI provider
- prompt versioning and structured output contract
- claim-evidence validation
- citation validation
- quality gate engine
- block invalid content from auto-publish

### Workstream D — rendering and publication
- domain-to-site rendering
- theme presets and layout validation
- preview flow
- idempotent publishing
- destination verification and rollback

### Workstream E — lead funnel and compliance
- contact form
- email verification
- short-lived secure tokenized download
- consent and rate limiting
- retention policy

### Workstream F — migration and readiness
- pilot migration
- redirect validation
- rollback rehearsal
- production safety checks
- load and restore tests

---

## 5. Phase plan

### Phase 0 — Repository + risk audit

Goal:
- determine what already exists, what is safe to reuse, and what is missing

Required outputs:
- repo inventory
- current build and test commands
- deployment assumptions
- existing WordPress or publishing integrations
- rights/privacy requirements
- site and content ownership model

Exit criteria:
- we know what is already implemented
- we know what must be built from scratch
- we know which decisions are still ambiguous
- we have a concrete plan for the first safe slice

Do not start feature implementation until this is complete.

---

### Phase 1 — Secure foundational platform

Goal:
- build the stable backbone for all later work without exposing risk

Scope:
- auth and RBAC
- site registry and host mappings
- site-level scoping for every data access path
- audit logs and correlation IDs
- secrets interface
- global and per-site kill switches
- minimal structured job runner

Acceptance criteria:
- no cross-site data access without authorization
- unknown hostnames fail closed
- all actions can be traced with a request/job ID
- secrets are not stored in code
- safe pause controls exist for ingest, AI, and publish

Test requirements:
- unit tests for auth and scoping
- Playwright tests for admin flows and restricted access
- black-box cross-site access checks
- regression tests for site login and authorization

---

### Phase 2 — Vertical slice: one site, one PDF, one AI provider

This is the critical phase.

Goal:
- prove the full safe lifecycle from approved PDF to preview and/or publish

Scope:
- one staging site config
- one approved PDF source
- one secure ingest flow
- page-aware evidence extraction
- one AI provider selected for v1
- one structured draft generation contract
- claim and citation validation
- blocked auto-publish when rules fail
- public rendering for the staged site
- preview-only or staging publish flow
- basic audit logs and rollback path

Required behavior:
- site config creation works without code deployment
- source PDF passes ingest and provenance checks
- evidence is stored with page references
- AI draft includes citations and claim mapping
- missing evidence, invalid citations, rights denial, or quality gate failure blocks publish
- publish retries remain safe and idempotent

Exit criteria:
- one real end-to-end path works in staging
- no unsafe publish path exists
- one provider contract is stable
- risk is understood before expansion

Test requirements:
- unit tests for ingestion, rights, citation, and publish logic
- Playwright tests for onboarding, upload, draft review, preview, and block states
- black-box validation with a real approved PDF and a bad PDF
- regression tests for the successful staging workflow

---

### Phase 3 — Hardening and production safety

Goal:
- make the vertical slice robust against bad inputs and provider failure

Scope:
- malicious file and URL test suite
- rights enforcement and state transitions
- provider timeout/retry/fallback and telemetry
- evaluation corpus for valid and invalid examples
- prompt injection controls and validation
- backup and restore rehearsal
- retention and log retention policy

Acceptance criteria:
- known malicious inputs are blocked
- rights-denied inputs do not generate or publish content
- provider failures do not create broken state
- backups and restore process are validated
- retention rules are actionable and measurable

Test requirements:
- security test suite
- black-box failure tests
- regression suite for successful flow
- restore simulation

---

### Phase 4 — Publish and lead funnel

Goal:
- support safe publication and lead capture once the content path is trusted

Scope:
- idempotent publish job framework
- reconciliation and rollback validation
- contact form for whitepaper request
- email verification
- short-lived secure download token
- consent tracking and rate limiting
- retention and abuse controls

Acceptance criteria:
- retrying a publish job does not create duplicate content
- token reuse is rejected
- unverified email cannot receive the download
- invalid or expired tokens fail closed
- consent and retention controls are auditable

Test requirements:
- unit tests for token and publish logic
- Playwright end-to-end for lead capture and verification
- black-box validation for replay and abuse attempts
- regression for publish and download flows

---

### Phase 5 — Multi-site expansion

Goal:
- expand from one proven site to multiple sites safely

Scope:
- additional approved themes and layout presets
- per-site config and cache isolation
- SEO metadata validation
- analytics integration with secret isolation
- site-level dashboards and operational checks

Acceptance criteria:
- new site onboarding does not require new app deployment
- rendering remains isolated per site
- no shared stale cache or cross-site leak occurs
- analytics and credentials remain site-scoped

Test requirements:
- Playwright render tests for more than one site
- black-box cross-site isolation checks
- regression for existing site rendering and analytics

---

### Phase 6 — WordPress pilot migration

Goal:
- migrate a low-risk domain with rollback in place before scaling

Scope:
- pilot domain export and validation
- URL mapping and redirect traffic test
- cutover and rollback rehearsal
- analytics continuity checks
- content parity validation

Acceptance criteria:
- pilot domain remains stable across cutover
- redirect fidelity is validated
- rollback path works
- no competing publish systems remain active on the same domain

Test requirements:
- migration smoke tests
- Playwright verification of migrated pages
- rollback rehearsal validation
- regression for unaffected domains

---

### Phase 7 — Production readiness and release

Goal:
- certify the system before broader production exposure

Scope:
- load testing
- restore drill
- alerting and runbooks
- security closure and final audit
- release checklists and launch decision

Acceptance criteria:
- load and restore tests pass
- critical/high security issues are closed or explicitly accepted
- alerts and rollback are proven in staging
- launch gate is met with evidence

Test requirements:
- load and resilience suite
- full regression pass
- final security review

---

## 6. Exit gates

A phase is complete only if all of the following are true:
- requirements for that slice are fully defined
- all affected tests were actually executed
- relevant unit, Playwright, black-box, and regression checks passed
- security/privacy review was completed for the changed surface
- defects were fixed and re-tested
- the phase outcome is proven in staging

If any one of these is missing, the phase is not complete.

---

## 7. Explicit decisions before implementation begins

1. Which system is authoritative for each domain during v1?
2. What is the allowed rights taxonomy for PDF sources?
3. What is the initial AI provider, model, and contract?
4. What are the required RPO/RTO, retention, and deletion requirements?
5. What is the initial domain count and expected content volume for the first slice?

These are not optional planning details; they are execution blockers.

---

## 8. Implementation sequence for the first 30–45 days

1. Repository and environment audit
2. Secure foundation: auth, site registry, kill switches, audit logging
3. One staging site configuration flow
4. One authorized PDF ingestion and evidence extraction
5. One AI provider and one draft generation contract
6. Quality gate: block invalid publication
7. Preview path and safe staging publish check
8. Email verification and secure token flow
9. Audit, restore, and rollback rehearsal
10. Only then consider additional themes or migration work

This is the true first milestone.

---

## 9. Final principle

The right plan is not “build everything in order.”
The right plan is:
- build one safe, auditable path
- prove it in staging
- then expand deliberately

If the first safe pipeline fails, no later work should continue. The architecture is only valid if the first slice works end to end.
