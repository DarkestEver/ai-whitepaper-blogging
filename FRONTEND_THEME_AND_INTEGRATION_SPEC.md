# Frontend, Themes, Templates, and Integration Specification

**Status:** Proposed implementation baseline; public catalog prototype implemented, remaining interfaces and production controls pending. Design, SEO, security, privacy, and vendor approvals are required where indicated.  
**Applies to:** Admin/control plane, multi-domain public renderer, service APIs, background workers, and external provider adapters.

This document defines the expected quality and behavior of the user experience and integration layer. It complements, and does not override, the schemas and controls in [TECHNICAL_SPECIFICATION.md](./TECHNICAL_SPECIFICATION.md).

---

## 1. Product experience goals

### Admin experience

- Clean, modern, professional, calm, and operationally clear.
- Prioritize work queues, review status, evidence, exceptions, and safe actions over decorative dashboards.
- Make current site scope visible on every site-scoped admin view.
- Make destructive, production, irreversible, or externally visible actions deliberate and auditable.
- Give users a clear reason and next step for every validation, permission, quality-gate, or integration failure.

### Public-site experience

- Each site must have a distinct, approved brand identity while sharing supported application code.
- Public pages must be fast, responsive, readable, accessible, and server-rendered or statically generated/revalidated using Next.js.
- Editorial content, provenance/citations, calls to action, privacy notices, and download flow must be clear and consistent.
- Never imply generated imagery is a source figure or claim a source supports a claim unless evidence metadata confirms it.

### Design quality gate

Design must be reviewed at agreed desktop, tablet, and mobile viewports before a theme is accepted. “Clean/modern/professional” is not accepted by subjective assertion alone: review screenshots, usability tasks, accessibility checks, SEO output, and visual regression results.

### Reference-site patterns

The following public sites are product/UX references supplied by the project owner, not implementation specifications or endorsements:

- [Whitepapers Online](https://whitepapersonline.com/) — its public service pages describe whitepaper hosting, syndication, lead generation, submission/review, gated lead capture, distribution, and campaign reporting.
- [Online Whitepapers](https://www.onlinewhitepapers.com/) — its public homepage demonstrates a browsable whitepaper catalog with topic/category paths, content cards, summaries, publisher branding, and pagination.

Use these as prompts for requirements discovery and usability benchmarking:

- **Reader discovery:** searchable/category-based catalog, useful content cards, clear publisher attribution, accessible detail pages, and a predictable request/download journey.
- **Publisher workflow:** document submission, rights and quality review, metadata/brand setup, preview, approval, publication, and correction/takedown controls.
- **Lead-generation campaign (only if approved in product scope):** explicit form fields and purpose, consent evidence, audience/campaign configuration, lead qualification, delivery controls, and measurable reporting.
- **Trust and transparency:** identify who publishes the document, what data a form collects and why, whether access is gated, and how privacy/marketing preferences are controlled.

Do not copy their text, images, layout, branding, code, or proprietary assets. Create original visual designs and validate any observed behavior directly before treating it as a requirement. These references do not establish a price list, subscription model, terms, privacy compliance, consent legality, or permission to syndicate third-party content; those require the project’s own approved decisions.

---

## 2. Frontend application architecture

### 2.1 Next.js rendering model

- Use Next.js App Router for the public renderer and admin UI unless repository discovery establishes an approved existing alternative.
- Public article, topic/category, author, whitepaper detail, and legal pages should render on the server or be statically generated/revalidated according to an approved freshness policy.
- Set `title`, description, canonical, robots directives, Open Graph/social metadata, and structured data from validated page/site data on the server.
- Admin-only, preview, verification, and token endpoints must not be indexable; do not include them in public sitemaps.
- Do not expose secrets, unpublished drafts, raw lead PII, internal IDs, or evidence payloads through public HTML or client bundles.
- Keep client-side components limited to interactions that need browser state. Data access, authorization, provider calls, and publish decisions remain server-side.
- Hostname resolution must use trusted request metadata and the approved proxy boundary; unknown hostnames fail closed.

### 2.2 Frontend feature boundaries

```text
apps/web/
  app/
    (public)/             Server-rendered public routes
    (admin)/              Authenticated admin routes
    api/                  Thin route handlers only where needed
  components/
    ui/                   Shared accessible primitives
    admin/                Admin-specific modules
    public/               Public-site modules
  features/
    sites/
    sources/
    evidence/
    articles/
    publishing/
    downloads/
    integrations/
  themes/
    registry.ts           Code-owned approved theme registry
    presets/
```

Route handlers and server actions must call the same application services and authorization policies as the API. Do not duplicate business rules in React components.

---

## 3. Design system

### 3.1 Tokens and themes

Define semantic tokens; do not spread raw color values through component CSS.

```ts
export interface DesignTokens {
  color: {
    canvas: string;
    surface: string;
    surfaceRaised: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
    brand: string;
    brandContrast: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    focusRing: string;
  };
  typography: {
    bodyFamily: string;
    headingFamily: string;
    monoFamily: string;
    bodyScale: string;
    headingScale: string;
    lineHeight: string;
  };
  spacing: Record<"1" | "2" | "3" | "4" | "6" | "8" | "12", string>;
  radius: Record<"small" | "medium" | "large" | "pill", string>;
  elevation: Record<"card" | "popover" | "modal", string>;
  content: {
    maxReadingWidth: string;
    maxLayoutWidth: string;
  };
}
```

Theme settings are validated against a code-owned schema and safe ranges. Theme configuration can select values and approved components; it cannot supply executable markup, CSS, JavaScript, arbitrary URLs, or an untrusted font import.

### 3.2 Theme and preset scale requirement

**Catalog requirement:** provide at least **36 site design preset definitions** as the initial scalable catalog. A preset is a named, versioned combination of a supported theme family, layout composition, design-token profile, and capability configuration. It is not a separate app, arbitrary template language, or 36 independent codebases. A definition is not production-assignable until it completes the approved lifecycle.

Separate the concepts:

- **Theme family:** visual identity and component styling rules.
- **Page template:** semantic page structure (article, topic, home, etc.).
- **Layout preset:** approved composition of shared page templates and components.
- **Site design preset:** versioned catalog entry combining a family, layout preset, token profile, and enabled capabilities.
- **Site brand configuration:** per-domain logo, approved colors/type selection, name, navigation, and editorial settings.

Changing a site's color or logo must not create a new preset. New presets are justified when structure, editorial hierarchy, or component composition differs materially.

### 3.3 Initial 36-preset catalog

Use six families with six layout presets each. Names are planning IDs; design owners must approve final visual references before the preset is marked production-approved.

| Family | Preset IDs (six per family) | Intended content shape |
|---|---|---|
| Editorial / Newsroom | `editorial-lead-grid`, `editorial-classic-columns`, `editorial-topic-hub`, `editorial-longform-feature`, `editorial-local-briefs`, `editorial-mixed-stream` | News, analysis, features, category-led discovery |
| Research Library | `research-report-index`, `research-topic-catalog`, `research-author-led`, `research-data-summary`, `research-whitepaper-focus`, `research-briefing-stream` | Research reports, whitepapers, evidence-led explainers |
| Technical Journal | `technical-documentation-led`, `technical-engineering-notes`, `technical-analysis`, `technical-tutorial-series`, `technical-release-briefs`, `technical-topic-index` | Technical explainers, tutorials, standards, engineering analysis |
| Industry Briefing | `industry-market-pulse`, `industry-sector-hub`, `industry-regulatory-watch`, `industry-executive-brief`, `industry-comparison`, `industry-news-stream` | Sector reports, regulations, market updates, executive summaries |
| Innovation / Product | `innovation-product-news`, `innovation-case-study`, `innovation-research-lab`, `innovation-product-guides`, `innovation-launch-stream`, `innovation-topic-showcase` | Product/technology coverage, case studies, launch updates |
| Executive Insights | `executive-opinion-led`, `executive-author-column`, `executive-strategy-brief`, `executive-interview`, `executive-roundtable`, `executive-insight-stream` | Leadership perspectives, interviews, strategy and commentary |

Catalog completeness means all 36 registry entries are discoverable, versioned, schema-valid, previewable, and covered by automated rendering tests. Each entry has a lifecycle state; only `approved` presets may be assigned to production sites. It does **not** require bespoke implementation of 36 separate renderers.

### 3.4 Shared page-template library

Build the page-template library once and compose presets from it. Minimum template set:

1. Home
2. Topic/category listing
3. Article
4. Long-form feature
5. Author profile
6. Search results
7. Whitepaper/report detail
8. Download request
9. Email verification result
10. Legal/privacy
11. 404/unavailable
12. Admin dashboard
13. Site configuration/theme preview
14. Source/evidence review
15. Article editor/quality review
16. Publishing-job detail/list
17. Integration configuration/status
18. Audit/activity view

Each site design preset declares the templates it supports and the allowed component/layout variants for each. The registry must reject unsupported family-template combinations.

### 3.5 Preset registry contract

```ts
export interface SiteDesignPreset {
  id: string;
  version: string;
  family:
    | "editorial"
    | "research"
    | "technical"
    | "industry"
    | "innovation"
    | "executive";
  displayName: string;
  description: string;
  layoutPresetId: string;
  designTokenProfileId: string;
  supportedTemplates: string[];
  supportedComponents: string[];
  capabilities: {
    tableOfContents: boolean;
    citations: boolean;
    gatedDownload: boolean;
    authorPanel: boolean;
    topicNavigation: boolean;
    filters: boolean;
  };
  schemaVersion: string;
  lifecycle: "draft" | "approved" | "deprecated";
}
```

Requirements:

- Registry IDs are stable; display names may change without changing IDs.
- Every entry has a version, owner, changelog, preview fixture, and deprecation/migration policy.
- Site configuration stores `presetId` and `presetVersion`; do not store executable layout code in MongoDB.
- Runtime validates a requested ID against the registry and verifies supported templates/capabilities.
- Deprecated presets remain renderable for existing sites until an approved migration is complete.
- No preset may bypass rights, publication, security, accessibility, or SEO policies.

### 3.6 Catalog rollout strategy

The target catalog is 36 presets, but rollout is staged to protect quality:

1. Build the shared template/component system and registry contract.
2. Implement and approve one representative preset from each of the six families (six presets total).
3. Validate the rendering architecture, authoring configuration, visual QA, accessibility, SEO, and rollback.
4. Implement the remaining five presets per family as configuration/layout compositions using the validated primitives.
5. Promote each entry through draft → schema-validated → previewed → approved before site assignment.

Do not postpone the catalog contract until after the first three themes. The registry, schema, versioning, capability matrix, and test harness must support all 36 from the beginning.

### 3.7 Preset and template validation matrix

- Unit: registry uniqueness, schema validation, supported-template matrix, token bounds, capability constraints, deprecation behavior.
- Component tests: each shared component with loading/empty/error/long-content/focus states.
- Playwright: all 36 presets render their primary representative template at desktop; all six families render core public templates at mobile and desktop.
- Visual regression: capture the preset catalog at a fixed desktop viewport for all 36 entries; review diffs, do not auto-accept.
- Pairwise coverage: exercise family × template × content-shape combinations, including long title, missing media, citations, gated CTA, no results, and RTL/localized fixture if localization is in scope.
- Accessibility: automated checks for all 36 catalog previews; manual WCAG 2.2 AA review for one representative preset per family and any preset with materially different interactions.
- SEO: verify server-rendered HTML metadata, canonical, robots, structured data, and sitemap inclusion/exclusion for every template type and representative family.
- Rollback: switch a site from one approved preset/version to its prior preset/version and confirm only that site's cache is invalidated.

The catalog test report must identify exactly which preset, template, viewport, fixture, and browser version were tested.

### 3.3 Visual language

Design system requirements:

- restrained palette with accessible text/background contrast
- clear typographic hierarchy and consistent reading measure
- consistent spacing, border, radius, elevation, and icon rules
- visible focus states and clear hover/pressed/disabled states
- avoid excessive gradients, animation, dense card grids, and dashboard decoration
- support reduced motion and user zoom
- support light/dark mode only if a complete contrast-tested pair is implemented; otherwise ship the approved light or dark scheme consistently
- do not use color alone to communicate status

### 3.4 Responsive behavior

Use content-driven breakpoints validated against actual layouts. Required test viewports:

- small mobile: 360 × 800
- large mobile: 430 × 932
- tablet: 768 × 1024
- desktop: 1280 × 800
- wide desktop: 1440 × 900

Acceptance:

- no unintended horizontal scrolling
- no clipped action menus or dialogs
- article text remains readable without horizontal pinch-zoom
- admin navigation and tables adapt to small screens, including a card/list alternative where dense tables do not fit
- touch targets meet the adopted accessibility target

---

## 4. Page templates

All templates use typed data, reusable components, and server-generated SEO metadata.

| Template | Required content and behavior | SEO/indexing |
|---|---|---|
| Homepage | Site identity, configured feature/lead stories, topic paths, editorially approved CTA | Index only when configured and populated |
| Topic/category | Title/description, paginated content, optional filters | Canonical page URLs; noindex thin/empty/filter variants unless policy allows |
| Article | Title, summary, author/date, body blocks, citations, related content, optional CTA | Article metadata from visible content; canonical per site |
| Long-form feature | Narrative hierarchy, contents navigation, source/figure treatment, related reading | Canonical per site; supported structured data only |
| Author | Approved bio and authored articles | Index only for complete, approved profiles |
| Search | Query, results, empty state, safe query handling | `noindex`; never sitemap-listed |
| Whitepaper/report detail | Report description, publisher/source context, rights-aware CTA | Index only if content is approved/public |
| Download request | Minimal form, consent labels, verification-pending state | `noindex`; no token in page metadata or analytics |
| Verification result | Success/expired/already-used/retry-safe state | `noindex`; avoid revealing account existence |
| Terms/privacy/cookies | Approved legal content, document owner, version, effective date, and contact details | Public, versioned, accurate; indexing follows approved policy |
| Plans/pricing | Only approved, effective plans; currency, billing interval, included limits, taxes, renewal and cancellation summary | Public only when commercial approval is complete; draft/expired offers must never render |
| Email preferences | Confirmation state and login-free unsubscribe result; no unnecessary PII | `noindex`; token and email excluded from metadata, logs, and analytics |
| 404 / unavailable | Helpful site-branded response, safe recovery links | Correct status code; no misleading success page |
| Admin dashboard | Site scope, pending review, jobs, alerts, actions | Authenticated, `noindex`, no public cache |
| Admin site settings | Domains, brand, theme, SEO, kill switches, integration status | Authenticated; permission scoped |
| Source/evidence review | Source status, rights, pages, extraction diagnostics | Authenticated; restricted evidence data |
| Article editor/review | Structured content, revision, citations, gates, preview | Authenticated; drafts never public |
| Publishing jobs | Job history, attempts, remote verification, retry eligibility | Authenticated; retry actions permissioned |
| Integration settings | Provider status, non-secret metadata, test/disable actions | Authenticated; secret values never read back |

Every template requires explicit loading, empty, error, unavailable, permission-denied, and success states appropriate to its behavior.

---

## 5. Admin information architecture

### Global frame

- Organization/platform navigation
- Prominent current site selector and environment badge
- Role-aware navigation
- User/access menu
- Notifications for actionable job/integration failures
- Keyboard-accessible skip link and landmarks

### Site-scoped navigation

1. Overview
2. Content
   - Sources
   - Evidence review
   - Articles/drafts
   - Publishing jobs
3. Site presentation
   - Theme/template preview
   - Navigation/categories
   - SEO configuration
4. Downloads and leads (permission-restricted)
5. Integrations
6. Audit and activity
7. Site settings and kill switches

### Required usability behavior

- Always show which site/environment the user is operating on.
- Do not show disabled actions without explaining the permission, gate, or integration reason.
- For a blocking error, show its stable error code in support details and a human-readable next action.
- Preserve unsaved editor work with an explicit save/draft state; never imply save success before server confirmation.
- Warn before leaving with unsaved changes.
- Use optimistic updates only for reversible, low-risk operations; publishing, deletion, cutover, and access changes require server confirmation.

---

## 6. Forms, validation, and modal/dialog behavior

### 6.1 Validation layers

Every input must be validated at the appropriate layers:

1. **Client UX validation:** immediate, accessible guidance; convenience only, not a security boundary.
2. **Server contract validation:** shared schema validates all API/server-action input.
3. **Domain validation:** authorization, business invariants, rights, state transitions, and cross-field constraints.
4. **Persistence constraints:** unique indexes, atomic transitions, and transaction/conditional updates where required.
5. **External-provider validation:** response schema and remote outcome verification.

On error:

- map field errors to the relevant visible control
- provide a summary when multiple errors exist
- retain safe user-entered values
- never echo secret values, tokens, or sensitive source text in an error response
- use stable error codes suitable for support and telemetry
- distinguish validation, authorization, policy, rate-limit, transient, and dependency errors

### 6.2 Modal/dialog policy

Use dialogs for short, focused decisions, not for complex workflows that need durable navigation or extensive data entry.

Required dialogs:

- confirm high-impact actions such as publish, archive/delete, kill-switch changes, or migration cutover
- show concise consequences, target site/environment, affected revision/source, and rollback availability
- provide explicit cancel and confirm actions; destructive actions must not be the default focused action
- require typed confirmation only for approved irreversible/high-impact actions

Accessibility and behavior:

- use a semantic `<dialog>` or a tested accessible dialog primitive
- accessible name and description are programmatically associated
- focus moves into the dialog on open, is trapped within while modal, and returns to the invoking control on close
- Escape closes only when safe; in-flight destructive operations cannot be visually dismissed as though canceled
- background content is inert while modal
- keyboard-only use, screen reader announcements, zoom, and mobile viewport behavior are tested
- show async pending and error state; prevent duplicate submission
- dialogs must not contain the only copy of long forms, legal content, or complex review data

### 6.3 Accessibility target

Target WCAG 2.2 AA for public and admin experiences, subject to formal accessibility review. At minimum:

- semantic landmarks, headings, labels, and error associations
- full keyboard operation and visible focus
- contrast checked for each theme token combination
- alternative text and captions handled intentionally
- reduced-motion support
- screen-reader checks on dialogs, validation, job status, and async updates
- automated accessibility scans plus manual keyboard/screen-reader review

Automated scans are not a substitute for manual accessibility testing.

---

## 7. Theme authoring, preview, publishing, and rollback

### Theme lifecycle

```text
draft -> schema_validated -> previewed -> approved -> published -> superseded
```

### Requirements

- Theme preset and version are code-owned and versioned.
- Site token/config changes are schema-validated and versioned.
- Preview uses the actual target site config and representative content in an isolated, non-indexable route.
- Preview routes require authorization or a signed short-lived preview grant; never expose draft content publicly.
- Approval records actor, config version, timestamp, and preview build.
- Publishing a theme config does not mutate historical article revisions.
- Rollback selects an earlier approved config version and invalidates only the affected site cache.
- Config validation rejects unknown component IDs, unsafe CSS values, unsupported font sources, malformed URLs, and unsafe asset references.
- Theme updates are tested against the full template matrix and representative content, not just the homepage.

### Theme acceptance checklist

- [ ] Correct branding and typography on all required templates.
- [ ] Mobile/tablet/desktop layout reviewed.
- [ ] WCAG 2.2 AA automated checks and manual review completed.
- [ ] Contrast and focus states pass for all token combinations.
- [ ] Public HTML has correct title, description, canonical, robots, social metadata, and supported structured data.
- [ ] No draft/lead/secret data leaks to HTML or client bundles.
- [ ] Visual regression differences are reviewed and accepted.
- [ ] Rollback to the previous config is tested.

### 7.1 Catalog size acceptance

- [ ] Registry contains at least 36 site design preset definitions, arranged as six families × six presets.
- [ ] Each preset has a stable ID, version, family, supported-template list, capabilities, preview fixtures, and changelog.
- [ ] Each preset is a safe composition of shared templates/components/tokens, not an independent app or executable template.
- [ ] Six representative family presets pass full visual/accessibility review before the remaining catalog is developed.
- [ ] All 36 presets pass schema, rendering-smoke, and visual snapshot validation before the catalog is declared complete.
- [ ] Each preset intended for a production site has its own approved lifecycle status and D-17 design/brand review evidence.
- [ ] A preset cannot be assigned to a site if any required supported-template or capability check fails.

---

## 8. Backend and frontend interaction contract

### Backend responsibilities

- Authoritative identity and site authorization.
- Request validation, domain policy, and stable errors.
- Business state transitions and audit events.
- Quality-gate evaluation immediately before external side effects.
- Server-side secret retrieval and provider calls.
- Persisted job/revision/source state and reconciliation.
- Redaction and safe observability.

### Frontend responsibilities

- Display only data authorized by server responses.
- Provide accessible forms, interactions, states, and confirmations.
- Never make client-side role checks the only access control.
- Never call providers, storage, or destination APIs with exposed secrets.
- Treat client validation as UX only.
- Avoid embedding admin/personal data in public rendering or analytics events.

### API interaction standards

- All calls use typed request/response contracts from the shared contracts package.
- Include request and correlation IDs.
- Use abort/cancellation behavior for user navigation where safe; do not imply an external side effect was canceled unless server confirms it.
- Mutations are idempotent where retries are possible.
- UI polls or subscribes to job status with bounded frequency and backoff.
- Show job states: queued, running, retry-wait, succeeded, failed, reconciliation-required, canceled/held where supported.
- For each failure, show safe details, stable code, recovery action, and support correlation ID.
- Marketing consent is a separate, unchecked-by-default control; terms/privacy acknowledgment and download requests never imply newsletter opt-in.
- Pricing pages and checkout must show the exact approved plan/price version, billing interval, currency, tax treatment, renewal/cancellation terms, and links to applicable legal terms before confirmation.
- Subscription preference pages must provide an accessible, login-free unsubscribe path; never require a survey or account creation to unsubscribe.

---

## 9. Integration inventory and implementation contract

Every integration is represented by an adapter with health, configuration validation, safe test, disable, telemetry, and contract tests. An integration being in this inventory does not mean credentials or production use have been approved.

| Integration | Purpose | Initial rollout | Secrets/data controls | Required tests |
|---|---|---|---|---|
| AI provider | Draft generation and possibly classification | One provider in the first slice; add major vendors through common contract after evaluation | Provider key in secret manager; data terms/region approved; spend ceiling; no silent failover | Schema contract, timeouts, rate limit, malformed response, evaluation corpus, cost/latency |
| Major AI candidates | OpenAI, Azure OpenAI, Anthropic, Google Gemini, Mistral, Cohere; compatible hosted/local endpoint if explicitly approved | Candidate adapters, not simultaneous launch requirement | Vendor-specific data handling, retention, region, and terms reviewed separately | Shared contract suite plus provider-specific capability tests |
| Identity provider | Admin login, MFA, service identities | One selected enterprise identity provider | OIDC/OAuth secrets server-side; least-privilege roles | Login, MFA/denial, expiry/revocation, role/site scope, logout |
| Object storage | Private source, evidence, image assets | One selected S3-compatible or managed service | Private bucket, scoped identity, encryption, lifecycle, access logs | ACL denial, upload/download, checksum, delete, outage/retry |
| MongoDB | Metadata, content, jobs/audit state | Managed/private service preferred | Private network, TLS, least privilege, backup and restore | Indexes, migrations, site scoping, concurrency, recovery |
| Redis/BullMQ | Job scheduling and execution | Managed/private service preferred | Private network, authentication, TLS where supported; no sole business-state dependency | Retry, lease, backlog, restart, dead-letter, recovery |
| Transactional email | Verification and operational email | One selected provider, sandbox first | No unnecessary PII, domain authentication, bounce/complaint handling, retention approved | Delivery sandbox, failure, resend limit, link expiry, no account enumeration |
| WordPress REST API | Export and controlled publishing adapter | Read-only export first; destination adapter only if selected as authoritative | Per-site scoped application credentials; rotation; no secrets in UI/logs | Contract, pagination, rate limit, media, partial failure, reconciliation |
| GA4 | Site analytics reporting/events | Metadata/config only until consent decision | Per-site property/config; credentials held server-side | Event contract, consent, site isolation, unavailable provider |
| Google Search Console | Indexing diagnostics/sitemap status | Read-only first | Least privilege, OAuth refresh token in secret manager | Authorization expiry, quota, site isolation, sync freshness |
| Bing Webmaster Tools | Indexing diagnostics | Read-only first | Least privilege, secret protected | API contract, quota/failure, site isolation |
| DNS/TLS/reverse proxy | Host validation and delivery | Explicit provider/owner required | DNS account separation, certificate renewal monitoring | Unknown host, renewal, redirect/TLS checks, rollback |
| Observability provider | Logs, metrics, traces, alerts | Staging telemetry first | Redaction, region/retention approval, restricted access | Sensitive-data scan, alert routing, outage/buffer limits |

### 9.1 Standard adapter interface

```ts
export interface IntegrationAdapter<Config, Health, TestInput, TestResult> {
  validateConfig(config: Config): Promise<{ valid: boolean; issues: string[] }>;
  healthCheck(config: Config): Promise<Health>;
  testConnection(config: Config, input?: TestInput): Promise<TestResult>;
  disable(integrationId: string, actorId: string, reason: string): Promise<void>;
}
```

Feature-specific adapters extend this interface with typed operations. Do not create one generic adapter that erases provider capability differences.

### 9.2 Integration lifecycle

```text
unconfigured -> configured -> validating -> active -> degraded -> disabled
                                            \-> failed
```

- Credentials are write-only in the UI: display provider, account/property identifier, status, last successful test, and secret reference status, but never read back secret values.
- Test-connection action must be explicit, rate-limited, audited, and safe (no publish/send/charge side effect).
- Integration failures must be visible and distinguish configuration, authentication, rate limit, transient network, and provider outage.
- Disabling an integration prevents new work and handles queued jobs according to an explicit hold/cancel policy.
- Rotation procedure must support overlapping credentials where the provider permits it.

---

## 10. Frontend validation matrix

| Surface | Client validation | Server/domain validation | Required UX tests |
|---|---|---|---|
| Site create/edit | Required fields, domain format, token ranges | Host normalization, uniqueness, actor permission, allowed preset | Valid, duplicate domain, unknown preset, forbidden actor |
| PDF upload | Type/size preflight, progress | Actual signature, byte/page limits, checksum, rights, quarantine | Valid file, malformed, oversized, duplicate, paused ingest |
| PDF URL | URL format, HTTPS hint | DNS/IP/redirect revalidation and SSRF controls | Private host denied, unsafe redirect, timeout |
| Draft generation | Required sources/format/language | Site/source scope, rights eligibility, kill switch, provider contract | Valid draft, missing evidence, provider outage, repeated request |
| Article editor | Block schema UX, required metadata, unsaved state | Full schema, safe link/asset validation, revision concurrency | Validation errors, stale revision conflict, save/reload |
| Quality review | Display gate status and clear actions | Recompute from persisted revision/source policy | Each hard gate fail, warning vs fail, policy version change |
| Publish/schedule | Confirm target/revision/time | Permissions, gate recheck, idempotency, destination status | duplicate submit, paused publish, partial remote result |
| Theme settings | Token/preset validation and live preview | Code registry, safe value bounds, version approval | responsive preview, invalid config, rollback |
| Lead/download | Email/consent feedback | Rate limit, privacy state, verified email, atomic one-use token | enumeration resistance, invalid/expired/replay |
| Newsletter subscribe/unsubscribe | Separate unchecked opt-in, confirmation and clear success state | Recorded wording/version, double opt-in, token validation, immediate suppression | no implicit opt-in, generic response, expired/replayed tokens, link-scanner GET safety, one-click idempotent unsubscribe |
| Terms/privacy/pricing | Current version, effective date, clear links and required pre-checkout disclosures | Approved published version and jurisdiction/config scope | stale terms, missing price disclosure, acceptance evidence, keyboard/screen-reader navigation |
| Paid plan/checkout (future gated scope) | Display published catalog and explicit renewal/cancellation details | Server-side entitlement, approved price version, provider authorization/webhook reconciliation | sandbox purchase, duplicate webhook, failed payment, past-due/grace, cancellation, refund/proration, unauthorized entitlement |
| Integrations | Safe configuration hints | Secret resolution, provider validation, scope and auth | bad credentials, outage, disabled adapter, no secret exposure |

For every form include loading, success, validation, permission-denied, service-unavailable, rate-limited, and stale/conflict states where applicable.

---

## 11. Playwright and visual test plan

### Critical end-to-end test suites

1. **Admin foundation:** authentication, MFA state, role-denied access, site selector, site-scope denial.
2. **Site authoring:** create draft site, configure approved theme, preview at target viewports, validate and roll back config.
3. **Source/evidence:** upload authorized PDF, inspect rights and extraction, open page-linked evidence, reject/quarantine invalid input.
4. **AI/editorial:** generate schema-valid draft, inspect evidence, edit revision, show unsupported claim and citation failure.
5. **Publishing:** approve, publish to staging, verify destination, retry, reconcile partial response, exercise kill switch.
6. **Public SEO:** inspect returned HTML (not only hydrated DOM) for title, description, canonical, robots, OG, schema, headings, and status code.
7. **Lead/download:** submit, verify via test mailbox, download once, reject expiry/replay, inspect consent and no PII leakage.
8. **Newsletter subscription:** submit without opt-in and verify no subscription; opt in, confirm via test mailbox, verify only intended list is enabled, unsubscribe without login, and prove subsequent campaigns are suppressed.
9. **Terms and pricing:** verify only approved/effective versions render, consent/acceptance evidence is recorded, and no unpublished or expired price is purchasable.
10. **Paid billing (future gated scope):** sandbox checkout, duplicate/out-of-order webhook, payment failure, renewal, cancellation, entitlement revocation, refund/proration, and invoice reference.
11. **Integrations:** configure safe test credentials, test connection, simulate outage, disable, verify queued work is held.
12. **Migration:** preview export/import, compare mapping/report, redirect check, rehearse rollback without changing production DNS.

### Visual regression requirements

- Maintain approved reference screenshots for each template/theme at 360×800, 430×932, 768×1024, 1280×800, and 1440×900.
- Stabilize fonts, time, and test content; mask only truly nondeterministic values.
- Review screenshot diffs; do not auto-accept visual changes solely to make CI green.
- Test system zoom/reflow and reduced-motion behavior.
- Include long titles, missing images, long citations, empty states, and validation errors in visual fixtures.

### Accessibility acceptance

- Automated accessibility checks on critical routes and dialogs.
- Manual keyboard-only completion of all critical tasks.
- Screen-reader review of navigation, modal, form errors, async job updates, and status announcements.
- Contrast review per theme token set.
- Document known exceptions with owner, remediation date, and compensating UX.

---

## 12. Integration validation and operations

For each adapter, test the following in an isolated environment:

1. Configuration schema and missing/invalid settings.
2. Secret retrieval and rotation without exposing values.
3. Healthy connection and safe test operation.
4. Authentication failure and permission-scope denial.
5. Quota/rate-limit response and retry-after handling.
6. Timeout, DNS/network failure, provider 5xx, malformed response.
7. Duplicate request/idempotency where side effects exist.
8. Provider outage and integration disable behavior.
9. Data minimization/redaction and audit event.
10. Recovery and reconciliation after ambiguous outcomes.

Do not treat a successful `healthCheck` as proof of functional correctness; use contract and scenario tests for actual operations.

---

## 13. Cross-document consistency and source of truth

The earlier planning files repeat similar content and can drift. Until they are consolidated:

- `README.md` is the navigation/status summary.
- `PROJECT_DECISION_REGISTER.md` is the source of truth for decision approval status.
- `ENTERPRISE_IMPLEMENTATION_PACK.md` is the source of truth for governance, phases, gates, and operating process.
- `TECHNICAL_SPECIFICATION.md` is the source of truth for API, domain, persistence, and service contracts.
- `FRONTEND_THEME_AND_INTEGRATION_SPEC.md` is the source of truth for frontend, theme, template, dialog, and adapter UX behavior.
- `DEPLOYMENT_AND_CAPACITY_BASELINE.md` is the source of truth for the 8-vCPU/8-GB VPS topology proposal and capacity assumptions.
- `GITHUB_ISSUE_BACKLOG.md` is a draft backlog; do not create implementation issues from it until reconciled with approved decisions and requirements IDs.
- Earlier implementation/blueprint docs are summaries. If they conflict with the source-of-truth documents above, update them rather than choosing whichever is more convenient.

At each phase gate, review conflicting names, phase numbers, assumptions, and old schedule estimates. Mark superseded planning documents rather than leaving contradictory instructions active.

---

## 14. Readiness statement

With this document, the team has a much more complete UI, template, modal, integration, and validation plan. It still does not mean that all provider integrations are enabled or that all templates have been designed, built, or accessibility-certified. Those outcomes require approved brand inputs, real content, test environments, provider decisions, implementation, and review evidence.

Before production:

- obtain required approvals in the decision register
- confirm actual target repository and system inventory
- approve brand/design tokens and visual references with stakeholders
- validate the VPS and dependencies against an agreed workload
- implement and pass the vertical slice and release gates
