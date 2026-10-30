# Phase Completion Work Plan

**Status:** Phase 1 complete, Phase 2-3 scaffolding started
**Date:** 2026-10-27
**Tests:** 27/27 passing | TypeScript: strict mode clean

---

## Phase 1: Secure Foundation ✅ COMPLETE

### Completed Tasks:
- ✅ User model with per-domain RBAC (admin/editor/reviewer roles)
- ✅ Multi-user login (database-backed username + password)
- ✅ Domain authorization checks on all API routes (content, sources, sites)
- ✅ Per-domain filtering on admin pages (content list, sources, sites)
- ✅ User management UI (/admin/users, /admin/users/new, /admin/users/[id])
- ✅ User management APIs (create, update, delete, role assignment)

### Started But Not Complete:
- ⏳ **MFA (TOTP)** — lib/mfa.ts created with TOTP generation/verification. Still needs:
  - MFA setup page (/admin/users/[id]/setup-mfa)
  - MFA verification during login
  - Recovery codes backup

### Not Started:
- ⏳ **Trusted-proxy policy** — Need X-Forwarded-For validation middleware
- ⏳ **Session hardening** — IP binding, rate limiting per user, fingerprinting

---

## Phase 2: Source Hardening (IN PROGRESS)

### What's Needed:
1. Private object storage with encryption
2. Malware scanning integration
3. PDF/OCR isolation (separate worker process)
4. Provenance tracking (chain-of-custody logging)
5. Rights evidence mapping

### Already Scaffolded:
- ✅ **File encryption (lib/file-crypto.ts)** — AES-256-GCM encryption for stored PDFs
  - `encryptFile(data, password)` — Encrypt PDF with key derivation
  - `decryptFile(encryptedData, password)` — Decrypt with authentication tag

### Next Steps:
1. Add provenance_log field to SourceDocument model
2. Create malware-check stub (ClamAV integration or API adapter)
3. Implement file encryption in PDF upload route
4. Add audit events for provenance chain
5. Build source evidence mapping UI

---

## Phase 3: AI Drafting & Quality Gates (NOT STARTED)

### What's Needed:
1. Approve AI provider/model (recommend: Anthropic Claude, already in code)
2. Configure credentials (API key management)
3. Build evaluation fixtures (test dataset of known-good outputs)
4. Citation/fact verification (enforce page citations, optional fact-checking)
5. Independent editorial review (separate reviewer approval)
6. Cost controls (budget per domain, monthly caps)
7. Monitored execution (logging, retry, error handling)

### Current State:
- Mock OpenAI/Anthropic/Gemini adapters exist in lib/ai-providers.ts
- AI generation disabled by default (lib/admin-http.ts kill switch)
- Editorial review gate already gates publishing (prevents auto-publish)

### Next Steps:
1. Update D-05 decision register to approve Anthropic + Claude
2. Create secrets manager for API keys (env var for now, move to vault later)
3. Build evaluation fixture UI and test framework
4. Enhance citation enforcement in ai-drafts.ts
5. Add independent reviewer role to content approval flow

---

## Phase 4-9: Other Phases

Not yet started. Order of priority:
1. **Phase 4**: Editorial workflow and staging publishing
2. **Phase 5**: Reader leads and protected downloads
3. **Phase 6**: Multi-site renderer and theme catalog
4. **Phase 7**: WordPress migration
5. **Phase 8**: Production operations and launch
6. **Phase 9**: Reader newsletter and commercial plans

---

## How to Continue

### For Phase 1 (MFA):
```bash
# Files to edit/create:
- app/admin/users/[id]/setup-mfa/page.tsx (new)
- app/api/admin/users/[id]/setup-mfa/route.ts (new)
- app/api/admin/login/route.ts (add TOTP verification)
- Update login page to prompt for MFA if enabled
```

### For Phase 2 (Source Hardening):
```bash
# Files to edit:
- lib/models.ts (add provenance_log to SourceDocument)
- lib/db.ts (add createProvenanceLog, listProvenanceLogs)
- lib/media.ts (integrate encryptFile, decryptFile)
- app/api/admin/source-documents/route.ts (encrypt PDFs on upload)
- lib/malware.ts (create stub for ClamAV/VirusTotal integration)

# New files:
- app/admin/sources/[id]/provenance/page.tsx
- lib/malware-check.ts (placeholder for scanning service)
```

### For Phase 3 (AI):
```bash
# Files to edit:
- PROJECT_DECISION_REGISTER.md (approve D-05 Anthropic + Claude 3.5 Sonnet)
- lib/ai-providers.ts (move from mock to live Anthropic API)
- lib/ai-drafts.ts (enhance citation enforcement, add cost tracking)
- app/admin/content/page.tsx (add AI evaluation score display)

# New files:
- lib/ai-evaluation.ts (test fixtures, quality metrics)
- app/admin/content/[id]/ai-evaluation/page.tsx (show citations, fact-check status)
```

---

## Testing & Verification

After each phase:
```bash
npm run typecheck  # Should be clean
npm test          # All 27 tests should pass (may add more tests per phase)
npm run build     # Production build should succeed
```

---

## Decisions Still Needed

Open blocking decisions (from PROJECT_DECISION_REGISTER.md):
- **D-03**: Select initial staging domain/hostname
- **D-04**: Approve source-rights statuses and evidence requirements
- **D-05**: Approve AI provider/model and data terms (RECOMMEND: Anthropic Claude 3.5 Sonnet)
- **D-07**: Decide lead identity scope and consent wording (for Phase 5)
- **D-08**: Approve retention/deletion SLA for all data classes
- **D-09-D-16**: Domain count, traffic, SLOs, hosting, migration, analytics, VPS details

**ACTION NEEDED BEFORE PHASE 3 PRODUCTION:**
Approve D-05 (AI provider): Select Anthropic Claude 3.5 Sonnet + data processing terms

---

## Local Dev Workflow

```bash
# Start dev server
npm run dev

# Login to admin
# URL: http://localhost:3000/admin
# Username: admin
# Password: local-prototype-password

# Create additional users
# Navigate to /admin/users → Create user
# Assign them to domains with roles

# Try RBAC isolation
# Create editor user for Site A
# Try accessing Site B content → Should see 404
```

---

## Next Session Priorities

1. **High**: Complete Phase 2 scaffolding (file encryption, provenance logging, malware stub)
2. **Medium**: Finalize Phase 1 MFA (optional, can defer)
3. **High**: Approve D-05 and scaffold Phase 3 (AI configuration)
4. **Medium**: Add evaluation fixtures and citation enforcement

---

**Good morning! Start with Phase 2. File encryption library is ready. Focus on:**
1. Add provenance_log to SourceDocument schema
2. Implement malware-check.ts stub
3. Integrate file encryption in PDF upload
4. Add provenance audit trail

Then move to Phase 3 AI setup once Phase 2 structure is solid.
