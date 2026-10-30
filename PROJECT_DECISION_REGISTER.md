# Centralized Multi-Site Publishing Platform
# Project Decision and Approval Register

**Status:** Unapproved; completion required before the affected implementation gate  
**Document owner:** Project sponsor to assign  
**Version:** 1.0  

This register is the authoritative work queue for business, legal, security, privacy, architecture, and operations decisions. A proposed default in another document is not an approval. Record the selected option, approver, date, rationale, scope, and review trigger here before enabling the affected capability.

## 1. Decision status definitions

- **Open:** No decision has been approved.
- **In review:** Options and impacts are being evaluated.
- **Approved:** Required accountable owners signed the record.
- **Rejected:** The proposed option is not accepted; document the selected alternative.
- **Superseded:** Replaced by a later approved decision; preserve history and link the replacement.

No decision is approved merely because a default appears in a plan or technical example.

## 2. Blocking decisions

| ID | Decision | Affected capability | Accountable approver(s) | Required by | Status |
|---|---|---|---|---|---|
| D-01 | Confirm implementation repository ownership/target and whether the current Next.js public-interface prototype becomes the production platform repository | All implementation work | Engineering lead + sponsor | Before Phase 1 | Approved |
| D-02 | Select authoritative publisher per domain and allowed hybrid transition | Publishing, public rendering, migration | Product owner + web operations | Before any production publishing | Approved |
| D-03 | Select initial staging domain/hostname and synthetic test data; domain owner maps DNS to the application host | Vertical slice | Product owner + operations; domain owner handles DNS mapping | Before Phase 2 | In review — no separate staging environment requested; environment decision required |
| D-04 | Approve source-rights statuses, evidence requirements, and allowed actions | Ingestion, extraction, drafting, publishing | Legal/privacy + content owner | Before processing real source material | In review — proposed rules supplied; accountable approval still required |
| D-05 | Select first AI provider/model and approve data processing, region, retention, and spend controls | AI generation | Product/AI owner + security + legal/privacy | Before sending non-public content to a provider | In review — provider/model should be configurable; per-provider controls still required |
| D-06 | Select identity provider, MFA, session model, role definitions, service identities, and access review cadence | Admin access and operations | Security + IT | Before admin access outside local development | Approved |
| D-07 | Decide lead identity scope, consent wording, lawful basis, verification and marketing separation | Public lead funnel | Product + privacy/legal | Before collecting real leads | Open |
| D-08 | Approve retention, deletion SLA, legal holds, and backup expiry for every data class | Sources, drafts, leads, logs, analytics | Privacy/legal + data owners + security | Before production data collection | In review — proposed retention until administrator deletion; legal/backup rules still required |
| D-09 | Define domain count, traffic, article volume, PDF size/page limits, concurrency, and AI spend ceiling | Capacity, cost, service design | Product + finance + SRE | Before sizing and capacity commitments | Open |
| D-10 | Define SLOs, RPO, RTO, support hours, incident severity, escalation, and service ownership | Production operations | Product + SRE/operations | Before production-readiness gate | Open |
| D-11 | Select hosting provider/region, network boundaries, encryption/key ownership, backup location, and data residency; the requested application host is a dedicated VPS with 8 vCPU and 8 GB RAM | Infrastructure and compliance | Architecture + security + legal/privacy | Before infrastructure procurement | In review — admin-managed Ubuntu/Docker stack proposed |
| D-12 | Approve WordPress export access, migration freeze, redirects, owner-managed DNS cutover timing, cutover window, and rollback owner | Migration | Migration owner + domain owner + operations | Before pilot cutover | Open |
| D-13 | Approve public-rendering model, freshness/caching requirements, canonical/robots behavior, sitemap and structured-data policy | SEO/public renderer | Engineering + SEO/content owner | Before public renderer implementation | Open |
| D-14 | Approve content authorship, human review, correction/takedown, and article retraction process | Editorial/publishing | Editorial owner + product + legal as applicable | Before auto-publish is considered | In review — automatic AI publishing proposed, but not permitted by current safety policy |
| D-15 | Approve analytics providers, consent behavior, credential ownership, and data freshness/reporting semantics | Analytics integrations | Product + privacy/legal + analytics owner | Before integration with real properties | Open |
| D-16 | Approve initial deployment topology using the specified dedicated VPS (8 vCPU/8 GB RAM), external stateful services, and accepted single-node risk | Infrastructure, resilience, capacity, production | Architecture + security + SRE + sponsor | Before capacity test or production infrastructure approval | In review — admin-managed Ubuntu/Docker/Node/Next.js/Mongo stack proposed |
| D-17 | Approve visual references, brand tokens, and production assignment of the 36-preset catalog | Public/admin UI, site onboarding, accessibility | Design/brand owner + product + accessibility reviewer | Before a preset is approved for production assignment | Open |
| D-18 | Approve reader email subscription purpose, frequency, consent wording, confirmation, unsubscribe, suppression, and retention rules | Newsletter/marketing email | Product + privacy/legal + email operations | Before collecting newsletter subscriptions or sending marketing email | Open |
| D-19 | Approve customer-facing terms, privacy/cookie notices, subscription terms, cancellation/refund language, and jurisdictional applicability | Public site and any paid offering | Legal/privacy + product + sponsor | Before public launch or paid subscription sales | Open |
| D-20 | Approve the commercial model (if any)—for example recurring subscription, campaign/service fees, cost-per-qualified-lead, or hybrid—and its currencies, price points, billing, taxes, trials, discounts, cancellation/refunds, lead definitions, and price-change policy | Commercial plans, campaigns, entitlements, invoicing, lead delivery | Product + finance + legal + sponsor | Before publishing an offer, accepting payment, or promising deliverables | Open |
| D-21 | Decide whether the platform is single-tenant internal software or a multi-customer SaaS, and define account/tenant ownership and subscription scope | Identity, data isolation, billing, support | Sponsor + product + architecture + security/legal | Before implementing customer billing or tenant onboarding | Approved |
| D-22 | Decide whether the product is an owned multi-site publisher, a vendor-facing whitepaper hosting/syndication/lead-generation platform, or a hybrid; define publisher/customer roles and lead ownership | Product scope, UX, data model, integrations, marketing, commercial model | Sponsor + product + editorial + sales/marketing + privacy/legal | Before implementing publisher onboarding, lead delivery, or paid campaign services | Approved |

## 3. Decision record

Copy this section for each decision. Preserve prior records when a decision is changed.

```text
Decision ID:
Title:
Status: Open / In review / Approved / Rejected / Superseded
Question:
Options considered:
Chosen option:
Rejected options:
Rationale and evidence:
Scope (domains, environments, data classes):
Security impact:
Privacy/legal impact:
Cost/operational impact:
Accountable owner:
Required approvers:
Approval date:
Implementation gate:
Affected documents, APIs, schemas, tests, and runbooks:
Review trigger or expiry:
Supersedes / superseded by:
```

### D-01 — Implementation repository and production target

```text
Decision ID: D-01
Title: Confirm implementation repository ownership and production target
Status: In review
Question: Is https://github.com/DarkestEver/ai-whitepaper-blogging the authoritative repository for this platform, and should the current Next.js/SQLite application become the production platform repository after the required hardening and approvals?
Options considered:
  1. Adopt the linked GitHub repository as the authoritative implementation repository and evolve the current prototype into the production platform.
  2. Keep the linked repository as a prototype only and create or designate a separate production repository.
Chosen option: Proposed option 1, pending formal approval.
Rejected options: None; option 2 remains available until ownership and production-target approval is recorded.
Rationale and evidence: The repository contains the current Next.js multi-site publishing prototype and its implementation documentation. Repository reference: https://github.com/DarkestEver/ai-whitepaper-blogging
Scope (domains, environments, data classes): Local development and staging planning for the owned multi-site publisher; no production credentials, real personal data, real source documents, DNS changes, or production deployment are authorized by this record.
Security impact: Repository ownership, branch protection, contributor access, secrets handling, dependency review, and production deployment controls must be verified before production use.
Privacy/legal impact: This decision grants no approval to process personal data, confidential source material, or provider data.
Cost/operational impact: Adopting the repository preserves the existing prototype investment but requires a separate production-hardening and operations workstream.
Accountable owner: Engineering lead — to be named.
Required approvers: Engineering lead + project sponsor — to be named.
Approval date: Not approved.
Implementation gate: Phase 0 completion and implementation kickoff; before Phase 1 production-foundation work is treated as authorized.
Affected documents, APIs, schemas, tests, and runbooks: IMPLEMENTATION_STATUS.md, IMPLEMENTATION_PLAN.md, AGENTS.md, repository access controls, CI/CD configuration, deployment documentation, and release runbooks.
Review trigger or expiry: Review when repository ownership, production repository selection, project sponsor, or deployment target changes.
Supersedes / superseded by: None.
```

### D-02 — Authoritative publisher and domain transition

```text
Decision ID: D-02
Title: Confirm the authoritative publisher for the initial domain
Status: In review
Question: Should whitepapervault.com be treated as the reference/initial publisher domain for the owned multi-site publisher, and which system is authoritative during any transition?
Options considered:
  1. Use whitepapervault.com as the initial reference domain and keep the existing publisher authoritative until an approved migration and cutover.
  2. Make the new platform authoritative immediately after staging validation.
  3. Use another domain or publisher as the initial authoritative system.
Chosen option: Proposed option 1, pending confirmation of domain ownership, publisher authority, and migration approval.
Rejected options: None.
Rationale and evidence: The project supplied https://whitepapervault.com/ as the candidate domain. The URL could not be independently fetched during this review, so no claims about its ownership, content, or current publishing system are recorded as verified evidence.
Scope (domains, environments, data classes): Candidate domain whitepapervault.com; local and staging planning only. No DNS, TLS, production publishing, migration, or cutover is authorized by this record.
Security impact: Domain ownership, trusted-host handling, TLS, deployment access, redirect safety, and rollback controls must be verified before use.
Privacy/legal impact: Existing content rights, privacy notices, cookies, analytics, and migration permissions must be reviewed before copying or publishing material.
Cost/operational impact: A hybrid transition reduces cutover risk but requires duplicate-publishing prevention, redirect testing, ownership coordination, and a rollback window.
Accountable owner: Product owner — to be named.
Required approvers: Product owner + web operations/domain owner — to be named.
Approval date: Not approved.
Implementation gate: Before public rendering, production publishing, migration, or domain cutover.
Affected documents, APIs, schemas, tests, and runbooks: IMPLEMENTATION_STATUS.md, IMPLEMENTATION_PLAN.md, domain/site registry, host-resolution tests, migration plan, redirect tests, cutover checklist, and rollback runbook.
Review trigger or expiry: Review when domain ownership, authoritative publisher, migration timing, or cutover strategy changes.
Supersedes / superseded by: None.
```

### D-06 — Identity and role administration

```text
Decision ID: D-06
Title: Define the current and future administrative access model
Status: In review
Question: Should the current prototype use a single administrator, with future role assignments managed by an authorized administrator and persisted in the database?
Options considered:
  1. Keep one local administrator for the prototype; later introduce named users, roles, and database-backed assignments managed by an authorized administrator.
  2. Implement production identity, MFA, RBAC, tenant isolation, and access reviews before any further administrative feature work.
  3. Use an external identity provider and centrally managed roles from the next environment onward.
Chosen option: Proposed enterprise single-tenant model: one platform administrator manages users and domain assignments; domain users receive RBAC permissions only for assigned domains; AI blogging is available as a shared platform capability but remains draft-only and subject to rights, provider, privacy, cost, and human-review controls. Production identity and RBAC remain to be selected and approved.
Rejected options: None.
Rationale and evidence: The current application is a local SQLite-backed prototype and currently operates with an administrator-level surface. Future role assignments may be stored in the database, but database-backed assignment alone is not sufficient production authorization or tenant isolation.
Scope (domains, environments, data classes): Local development/prototype only; synthetic data and local SQLite. No production users, personal data, real credentials, or external identity provider are covered by this proposal.
Security impact: Production implementation must add authenticated named users, MFA, least privilege, role separation, per-site authorization, session controls, auditability, access reviews, and protection against self-approval or privilege escalation.
Privacy/legal impact: User identity and audit data require an approved privacy, retention, and access policy before production use.
Cost/operational impact: The prototype remains simple, while later RBAC introduces identity-provider, support, recovery, audit, and access-review responsibilities.
Accountable owner: Security/IT owner — to be named.
Required approvers: Security + IT — to be named.
Approval date: Not approved.
Implementation gate: Before admin access outside local development or any production data processing.
Affected documents, APIs, schemas, tests, and runbooks: auth/session implementation, user and role schemas, admin authorization checks, audit events, access-review runbook, incident/recovery procedures, and IMPLEMENTATION_STATUS.md.
Review trigger or expiry: Review when the first non-local environment, additional administrator, production identity provider, or multi-site tenant authorization is introduced.
Supersedes / superseded by: None.
```

### D-21 — Enterprise tenancy and domain-scoped administration

```text
Decision ID: D-21
Title: Define enterprise ownership, domain users, and domain-scoped RBAC
Status: In review
Question: Should the platform be a single-tenant enterprise tool managed by one platform administrator, with users assigned to one or more domains and permissions enforced per domain?
Options considered:
  1. Single-tenant enterprise platform: one platform administrator manages users, domain membership, roles, and global controls; domain users can access only assigned domains.
  2. Multi-customer SaaS: separate customer tenants, tenant administrators, billing, support, and customer-level isolation.
  3. Shared administrator account with no domain-level user isolation.
Chosen option: Proposed option 1. The enterprise administrator owns global configuration and user/domain assignment. Domain-scoped users receive least-privilege RBAC for assigned domains. AI blogging is a shared capability, but generated content must remain associated with a selected domain and require human review before publication.
Rejected options: Option 3 is rejected for security and accountability reasons. Option 2 is out of current scope unless the product direction changes.
Rationale and evidence: The requested operating model is one enterprise-owned tool serving multiple domains, not a vendor-facing SaaS. Domain isolation is required so users cannot read, edit, approve, publish, or manage sources for domains outside their assignments.
Scope (domains, environments, data classes): All registered domains in the enterprise platform; local prototype first, then approved staging and production environments. Applies to sites, content, sources, drafts, approvals, schedules, analytics, credentials, audit records, and AI requests.
Security impact: Enforce server-side domain authorization on every read and mutation; separate global-admin permissions from domain roles; prevent cross-domain IDs, host routing, cache, exports, AI context, and audit leakage; require MFA, session controls, access reviews, and break-glass procedures in production.
Privacy/legal impact: User identity, audit records, source documents, and AI-provider processing require approved privacy, retention, rights, and data-processing policies. Domain assignment does not grant rights to source material.
Cost/operational impact: Single-tenant operation reduces SaaS billing complexity but requires enterprise user lifecycle management, administrator recovery, domain onboarding/offboarding, audit review, and AI spend controls across domains.
Accountable owner: Enterprise platform owner — to be named.
Required approvers: Sponsor + product + architecture + security/legal — to be named.
Approval date: Not approved.
Implementation gate: Before implementing production domain users, domain-scoped RBAC, real source intake, AI-provider use, or customer-facing access.
Affected documents, APIs, schemas, tests, and runbooks: user/domain membership schema, role and permission matrix, authorization middleware, admin APIs, AI request context, audit events, cross-domain isolation tests, onboarding/offboarding runbook, and IMPLEMENTATION_STATUS.md.
Review trigger or expiry: Review when external customers, billing, delegated tenant administration, a second enterprise, or cross-enterprise data sharing is introduced.
Supersedes / superseded by: None.
```

## 4. Approval rules

1. An approval is scoped to the named environment, domain(s), capability, and version.
2. Staging approval does not grant production approval.
3. Production publishing and domain cutover require domain-specific approval.
4. Rights, privacy, identity, or security decisions require their accountable owner; engineering cannot infer legal permission.
5. A high/critical security exception requires a compensating control, expiry date, and approver independent of the implementer.
6. Changes to an approved decision require a new record and impact review; do not silently overwrite history.
7. A decision marked Open or In review remains a blocker for all dependent production capabilities.

## 5. Gate dependency map

| Gate | Decisions that must be approved |
|---|---|
| Phase 0 completion / implementation kickoff | D-01; named project owners |
| Secure admin foundation | D-06; environment and secret-handling approach from D-11 |
| Capacity test design | D-09, D-10, D-11, D-16 |
| Source ingestion with real material | D-03, D-04, D-08, D-11 |
| AI generation using non-public material | D-04, D-05, D-08, D-11 |
| Public rendering, theme assignment, and SEO release | D-02, D-03, D-13, D-17 |
| Lead capture/download | D-07, D-08, D-11 |
| Analytics integration | D-08, D-11, D-15 |
| Newsletter subscriptions and marketing email | D-07, D-08, D-18, D-19 |
| Public legal/pricing pages | D-19, D-20 |
| Customer accounts, paid subscriptions, and billing | D-08, D-10, D-19, D-20, D-21 |
| Vendor publisher onboarding, campaign syndication, or lead delivery (not current scope) | D-04, D-07, D-08, D-18, D-19, D-20, D-21, D-22 |
| Vendor-facing UI and campaign analytics (not current scope) | D-15, D-19, D-22 |
| WordPress pilot cutover | D-02, D-10, D-12, D-13 |
| Production launch | All applicable decisions, including D-16, plus security/QA/operations release approvals |

## 6. Approval ledger

| Decision ID | Approver name/role | Approval date | Evidence or ADR link | Notes |
|---|---|---|---|---|
| D-01 | Project sponsor + engineering lead | 2026-10-26 | Local development environment; GitHub repository confirmed as authoritative | Repository ownership confirmed; local prototype to become production platform |
| D-02 | Product owner | 2026-10-26 | Domain ownership verified | whitepapervault.com confirmed as authoritative domain; owner-managed DNS mapping |
| D-06 | Engineering lead + security | 2026-10-26 | Phase 1 RBAC implementation planned | Immediate RBAC implementation approved before any production data access; MFA and per-site authorization required |
| D-21 | Project sponsor | 2026-10-26 | Single-tenant enterprise model selected | Single platform administrator manages users and domain assignments; no multi-tenant SaaS in scope |
| D-22 | Project sponsor | 2026-10-26 | Product direction confirmed | Owned multi-site publisher model approved; no vendor-facing syndication/lead-gen in initial scope |
