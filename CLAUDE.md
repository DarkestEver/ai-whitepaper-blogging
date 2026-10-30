# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Centralized multi-site publishing platform — one admin control plane managing multiple independently branded sites. Currently a **local prototype** (not production-ready). Built with Next.js 16 App Router, TypeScript 6, React 19, SQLite (better-sqlite3), Zod validation, and JOSE JWT auth.

## Commands

```bash
npm install          # Install dependencies
npm test             # Run all tests (25 tests via tsx --test)
npm run typecheck    # TypeScript strict-mode check
npm run build        # Next.js production build
npm run dev          # Dev server at http://localhost:3000
npm run admin:hash   # Generate scrypt password hash for ADMIN_PASSWORD_HASH env var
```

Required env vars: `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`. Optional: `DATABASE_PATH`, `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`.

## Architecture

**Routing:** Next.js App Router in `app/`. Public pages at `/` (catalog) and `/whitepapers/[slug]/` (detail). Admin UI at `/admin/*`. API routes at `/api/admin/*` and `/api/media/*`.

**Database:** SQLite with additive migrations in `lib/db.ts` (~1200 lines — schema, queries, migrations all in one file). Tables: `sites`, `whitepapers`, `source_documents`, `localAuditEvents`. Tests use `:memory:` databases.

**Multi-site:** `lib/request-site.ts` resolves incoming `Host` header to a registered site. Unknown hosts fail closed (404). All public queries are scoped by `site_id`.

**Auth:** `lib/auth.ts` — JWT sessions (HS256, HttpOnly cookie, 8h TTL). `lib/password.ts` — scrypt hashing. Login rate-limited (8 attempts/15 min). CSRF via same-origin POST check in `lib/admin-http.ts`.

**AI drafts:** `lib/ai-providers.ts` adapts OpenAI/Anthropic/Gemini. `lib/ai-drafts.ts` orchestrates generation with site context. No live credentials configured — mock contracts tested only.

**PDF intake:** `lib/pdf-text.ts` — bounded extraction (200 pages, 110KB text cap, 30s timeout). Bulk upload in `app/api/admin/source-documents/`.

**Themes:** `lib/themes.ts` — 36 typed presets (6 families x 6 presets).

**Editorial workflow:** Draft → in_review → approved/changes_requested. Publishing requires `status: published` + `editorialStatus: approved` + `sourceRightsStatus: allowed` (20+ char evidence).

**Tests:** `tests/catalog.test.ts` (catalog/pagination/search) and `tests/platform.test.ts` (DB, auth, PDF, AI contracts, host resolution). Node built-in test runner with tsx.

## Key Constraints

Follow [`AGENTS.md`](./AGENTS.md) for safety, phase order, testing, and documentation updates.

Before implementation, read [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md) and [`PROJECT_DECISION_REGISTER.md`](./PROJECT_DECISION_REGISTER.md). 23 blocking decisions (D-01 through D-22) must be resolved before their gated capabilities. Current phase: Phase 0 (discovery) → Phase 1 (secure foundations).

- Treat the app as a local prototype. Do not connect production credentials, AI providers, real source material, personal data, or payments without explicit approval.
- DNS is owned by the domain owner — do not modify DNS.
- Keep all AI-generated content draft-only and subject to human review.
- For each change: implement → run tests → fix failures → update status docs with observed evidence. Do not claim unrun tests or pending capabilities as complete.
- Stop at any owner-approval gate and record the blocker rather than inventing approval.
- Complete work in the order recorded in [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md).
