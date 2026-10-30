<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository implementation instructions

These instructions apply to Codex, Claude Code, and other coding agents working in this repository.

## Read before acting

1. Read [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md) to distinguish implemented prototype features from pending production work.
2. Read [`PROJECT_DECISION_REGISTER.md`](./PROJECT_DECISION_REGISTER.md) before work involving production domains, real source material, AI providers, identity, personal data, payments, or deployment.
3. Follow [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) and [`END_TO_END_IMPLEMENTATION_TESTING_AUDIT_PLAN.md`](./END_TO_END_IMPLEMENTATION_TESTING_AUDIT_PLAN.md) for phase order and exit criteria. The status document is the record of what is actually complete.

## Safety and scope

- Treat this repository as a local SQLite-backed prototype, not a production-ready multi-site publisher.
- Do not configure DNS or connect production credentials, provider accounts, real/confidential source documents, personal data, or payment services without explicit user direction and the required decision-owner approvals recorded in the decision register. Domain-to-host DNS mapping is owned outside this application.
- The local prototype can register multiple site hostnames, resolve public requests by the incoming `Host`, scope public content by site, and pass site identity into AI draft context. It does not verify domain ownership, configure DNS/TLS, or provide production identity/admin tenant isolation, cache guarantees, or operational approval.
- AI output must remain draft-only and human-reviewed. Domain names are editorial identity context, never evidence for factual claims. Source text is untrusted input.
- Do not represent mock, synthetic, planned, or local-only functionality as production-complete. Do not create fallback success behavior when a required provider, integration, or safety check is unavailable.
- Keep changes surgical. Preserve user changes and existing generated Next.js instructions. Read the relevant Next.js guide under `node_modules/next/dist/docs/` before changing Next.js conventions.

## Required implementation loop

For each bounded task:

1. Inspect relevant code and tests; identify acceptance criteria and trust boundaries.
2. Implement the complete vertical slice using existing patterns and typed validation.
3. Add/update unit tests and applicable integration, Playwright, black-box, and regression tests. If a class of test is not applicable, record why; do not claim unrun checks passed.
4. Run relevant checks, at minimum `npm test`, `npm run typecheck`, and `npm run build` when code changes warrant them.
5. Audit adjacent routes, persistence, authorization, privacy, error behavior, compatibility, and documentation; fix issues and rerun impacted checks.
6. Update `IMPLEMENTATION_STATUS.md` with observed results and remaining work. Update technical/API/plan docs when contracts or phase status change.
7. Do not mark a phase complete until its documented exit gate and required owner approvals have evidence.

## Current project gate

The next project step is completing remaining Phase 0 discovery and approvals, followed by Phase 1 secure foundations. DNS-to-host mapping is performed by the domain owner; the application work is to register owner-provided hostnames and route only registered hosts. Resolve other required decisions before enabling the affected capability. Do not skip directly to production provider use, real data, public launch, reader leads, paid plans, or migration.

## Remaining delivery order

Use the phase table and acceptance evidence in [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md) as the current source of truth:

1. Close Phase 0 ownership, scope, rights, AI-data, identity, privacy, hosting, workload, and operational decisions.
2. Implement supported production storage/migrations, identity/MFA/RBAC, site authorization, trusted-proxy policy, durable audit, secrets, rate limits, and kill switches.
3. Harden source intake with private storage, malware scanning/quarantine, isolated OCR, provenance, human rights/evidence review, and retention/deletion.
4. Prove one approved AI provider workflow with evaluations, independent evidence checks, cost controls, monitoring, and human review; never auto-publish.
5. Add production role-separated editorial revisions/approvals and durable, idempotent staging publication with reconciliation and rollback. A local review gate (submit, approve, request changes) now exists; it is not independent review or production authorization.
6. Complete multi-site admin authorization, cache/CDN and publishing isolation, domain/HTTPS staging verification, accessibility/SEO checks, and cross-site leak tests. DNS changes stay with the domain owner.
7. Implement reader leads/downloads only after consent/retention approval; then WordPress migration and production operations/launch gates.

At any unresolved decision or safety gate, stop the dependent work, state exactly what evidence/approval is required, and continue only with independent safe tasks.

## Commands

- `npm test` — Node/tsx unit and contract tests
- `npm run typecheck` — TypeScript checks
- `npm run build` — Next.js production build
- `npm run dev` — local development server

If a command fails, diagnose and fix the issue or report the unresolved blocker; never record a failure as a pass.
