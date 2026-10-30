# Critical Path Action Plan
**Owner Decision:** Approved for Development Staging
**Status:** Ready for Blocker Resolution
**Target:** Production-Ready in 4-6 weeks

---

## BLOCKING ISSUES (P0 - Must Fix Before Production)

### 1. BACKGROUND JOB PROCESSOR
**Issue:** Publishing jobs are queued but no daemon processes them
**Impact:** Scheduled content never publishes
**Severity:** 🔴 CRITICAL

#### Current State
```typescript
// Jobs are created in PublishingJob collection
scheduleForPublishing() // Creates pending job
getPendingPublishingJobs() // Queries due jobs
processPublishingJob() // Processes one job (idempotent)
```

#### What's Missing
- No scheduler daemon/cron
- No recurring background worker
- No retry mechanism for failed jobs

#### Solution Options
1. **Node.js Cron Job (Simplest)**
   ```javascript
   // In app server startup
   cron.schedule('* * * * *', async () => {
     const jobs = await getPendingPublishingJobs(60000); // Due in 1 min
     for (const job of jobs) {
       await processPublishingJob(job.numericId);
     }
   });
   ```
   - Use `node-cron` package
   - Runs every minute
   - Processes all due jobs
   - Idempotent (safe to retry)

2. **Standalone Worker Service (Production-Grade)**
   - Separate Node.js process
   - Listens to MongoDB change streams
   - Or polls every N seconds
   - Better for horizontal scaling

3. **AWS Lambda/Cloud Functions (Serverless)**
   - Triggered on schedule (CloudWatch Events)
   - Scales automatically
   - Pay per execution
   - No infra management

#### Recommendation
**Phase 1:** Use node-cron (simple, sufficient for MVP)
**Phase 2:** Scale to standalone worker for production

#### Implementation Steps
```
1. npm install node-cron
2. Create lib/job-processor.ts
3. Initialize in app startup (next.config.js or separate process)
4. Add error logging and retry backoff
5. Test with real scheduled jobs
Estimated: 2-3 days
```

#### Test Case
```
1. Create draft + submit + approve (editorialStatus=approved)
2. Schedule for publishing (1 minute from now)
3. Verify PublishingJob created with status=pending
4. Wait for cron to fire
5. Verify paper published (status=published)
6. Verify job marked completed
```

---

### 2. EMAIL SERVICE INTEGRATION
**Issue:** Newsletter, reader verification, and confirmation emails are not sent
**Impact:** Reader leads cannot verify emails, newsletters cannot send
**Severity:** 🔴 CRITICAL

#### Current State
```typescript
// Functions log but don't send emails
registerReaderLead() // Logs "verification email sent"
confirmNewsletterEmail() // Expects external verification
scheduleNewsletterCampaign() // Logs "blocked"
```

#### What's Missing
- No email provider configured
- No templates for emails
- No delivery tracking

#### Email Requirements
1. **Reader Lead Verification**
   - From: noreply@{domain}
   - To: reader email
   - Template: "Verify your email to access [paper]"
   - Link: `{baseUrl}/verify-email?token={token}`
   - TTL: 24 hours

2. **Newsletter Confirmation**
   - From: newsletter@{domain}
   - To: subscriber email
   - Template: "Confirm your newsletter subscription"
   - Link: `{baseUrl}/newsletter/confirm?token={token}`

3. **Newsletter Campaign**
   - From: newsletter@{domain}
   - To: subscribers (with one-click unsubscribe)
   - Template: Content + paper links
   - Tracking: Open/click rates (optional, Phase 2)

#### Provider Options
| Provider | Setup Time | Cost | Features |
|----------|-----------|------|----------|
| SendGrid | 30 min | $20/mo | Templates, tracking, webhooks |
| AWS SES | 15 min | $0.10 per 1K | Simple, reliable, AWS-integrated |
| Mailgun | 30 min | $25/mo | Rich API, templates, webhooks |
| Brevo (Sendinblue) | 20 min | Free tier | Good for SMB, free up to 300/day |

#### Recommendation
**Development/Staging:** AWS SES
**Production:** SendGrid (better templates + tracking)

#### Implementation Steps
```
1. Choose provider + create account
2. Verify sending domain (DNS TXT records)
3. Create email templates (3x: lead verify, newsletter confirm, campaign)
4. Implement sendEmail() helper in lib/email.ts
5. Wire into registerReaderLead(), confirmNewsletterEmail(), sendNewsletterCampaign()
6. Add retry logic for failed sends
7. Test end-to-end (check email inbox)
Estimated: 3-4 days
```

#### Test Case
```
1. Register reader lead
2. Check email inbox for verification email
3. Click link, verify token works
4. Try registering same email → dedup works
5. Subscribe to newsletter
6. Check confirmation email
7. Click confirm link
```

---

### 3. MAKE AI QUALITY SCORE A HARD FAIL
**Issue:** Low-quality AI output (score < 70) generates warning but still publishes
**Impact:** Low-quality content can reach readers
**Severity:** 🟡 HIGH

#### Current State
```typescript
// In generateDraftsForSource()
const evaluation = evaluateAIOutput(JSON.stringify(decoded));
if (evaluation.score < 70) {
  console.warn(`[AI Generation] Low quality score...`); // Warning only
}
// Content continues to be saved (no blocking)
```

#### Problem
- User gets no feedback that content is low-quality
- Content saves and can be published
- Editorial review may not catch poor evaluations

#### Solution
Make it a blocking error:
```typescript
if (evaluation.score < 70) {
  throw new Error(`AI output quality score too low (${evaluation.score}/100). Minimum required: 70. Please regenerate with better source material or manual review.`);
}
```

#### Thresholds (Recommendation)
- **< 50:** Reject immediately (clear failure)
- **50-70:** Warn but allow (manual review required)
- **70-90:** Accept with logging (good)
- **90+:** Accept, log as excellent

#### Implementation
```typescript
// In generateDraftsForSource
const evaluation = evaluateAIOutput(JSON.stringify(decoded));
if (evaluation.score < 50) {
  throw new Error(`Critical: AI output score ${evaluation.score}/100 - minimum 50 required`);
}
if (evaluation.score < 70) {
  console.warn(`Warning: AI output score ${evaluation.score}/100 - below recommended 70. Marked for manual review.`);
  paper.editorialStatus = "in_review"; // Force review
}

// Test this immediately
Estimated: 1 day
```

#### Test Case
```
1. Mock evaluateAIOutput() to return score 45
2. Attempt generateDraftsForSource()
3. Verify it throws error (doesn't create paper)
4. Mock score 65
5. Verify paper is created with editorialStatus=in_review
6. Mock score 85
7. Verify paper is created normally
```

---

### 4. MONGODB PRODUCTION INSTANCE
**Issue:** Database is scaffolded in code, no actual MongoDB connection
**Impact:** Cannot persist any data
**Severity:** 🔴 CRITICAL

#### Current State
```typescript
// lib/models.ts uses Mongoose
// But no connection string in production
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/wpblog')
```

#### What's Needed
1. **MongoDB Atlas Account** (free tier available)
   - Create account at mongodb.com/cloud/atlas
   - Create cluster (free tier: M0)
   - Create database user
   - Get connection string

2. **Environment Variable**
   ```
   MONGODB_URL=mongodb+srv://user:password@cluster0.abc.mongodb.net/wpblog?retryWrites=true
   ```

3. **Connection Pooling**
   - Mongoose default pool size: 10
   - For lambda: increase pool size
   - For server: default is fine

#### MongoDB Atlas Free Tier
- ✅ 512 MB storage
- ✅ Shared cluster
- ✅ SSL encryption
- ✅ Backups (daily)
- **Enough for:** MVP + staging

#### Implementation Steps
```
1. Create MongoDB Atlas account
2. Create M0 cluster
3. Add IP whitelist (0.0.0.0/0 for dev, restrict in prod)
4. Create database user
5. Get connection string
6. Add to .env: MONGODB_URL
7. Test connection: run tests
Estimated: 30 min
```

#### Connection Test
```bash
# In code or console
const mongoose = require('mongoose');
await mongoose.connect(process.env.MONGODB_URL);
console.log('Connected:', mongoose.connection.readyState); // Should be 1
```

---

### 5. OWNER DECISIONS (D-18, D-19)
**Issue:** Newsletter sending and billing are gated by decisions
**Impact:** Features are blocked until owner decides
**Severity:** 🟡 HIGH

#### D-18: Newsletter Email Sending
**Decision Required:** Can the platform send newsletter emails to readers?

| Option | Implication |
|--------|-------------|
| **YES** | Enable sendNewsletterCampaign(), wire to email service |
| **NO** | Keep gated, remove from production scope |
| **LATER** | Implement after launch (Phase 2) |

**Current:** Blocked, all functions log "decision required"

#### D-19: Paid Billing / Customer Plans
**Decision Required:** Will the platform offer paid plans to customers?

| Option | Implication |
|--------|-------------|
| **YES** | Implement billing integration (Stripe/Paddle), legal review, PCI compliance |
| **NO** | Remove from scope entirely, keep free-only |
| **LATER** | Defer to Phase 2, launch free first |

**Current:** Out of scope, BILLING_POLICY.active = false

#### Owner's Two-Minute Decision
```
D-18: Newsletter Sending
□ Yes - enable after Phase 1
□ No - remove from scope
□ Later - Phase 2 (defer)

D-19: Paid Billing
□ Yes - implement before launch (require legal review + PCI)
□ No - free-only MVP
□ Later - Phase 2 (after user base established)
```

#### Recommendation to Owner
For **MVP launch**, suggest:
- **D-18 = Later** (newsletter can be Phase 2 after user feedback)
- **D-19 = No** (free MVP first, add billing after 1K users)

This keeps launch timeline to 4-6 weeks.

---

## PRIORITY 1 BLOCKERS SUMMARY

| Item | Owner | Effort | Timeline | Est. Date |
|------|-------|--------|----------|-----------|
| Background Job Processor | Dev Team | 2-3 days | Week 1 | Oct 31 |
| Email Service Integration | Dev Team | 3-4 days | Week 1-2 | Nov 2 |
| AI Quality Gate (Hard Fail) | Dev Team | 1 day | Week 1 | Oct 30 |
| MongoDB Production Setup | DevOps/Owner | 30 min | Day 1 | Oct 28 |
| Owner Decisions (D-18, D-19) | Owner | 10 min | Day 1 | Oct 28 |

**Critical Path Timeline:**
```
Oct 28: Owner decides D-18/D-19, sets up MongoDB
Oct 30: AI quality gate implemented + tested
Nov 1: Background job processor done
Nov 2: Email service integrated + tested
Nov 3: Full integration testing begins
Nov 10: UAT in staging environment
Nov 17: Security audit completion
Nov 24: Production launch ready
```

---

## NICE-TO-HAVE ENHANCEMENTS (Non-Blocking)

These can be done after launch or in parallel if resources allow:

### 1. Monitoring Integration (APM)
**What:** Connect health checks to Datadog/New Relic
**Benefit:** Production visibility, alerts, dashboards
**Timeline:** 1-2 days (after launch)

### 2. MFA in Login Flow
**What:** Wire TOTP verification into admin login
**Benefit:** Enhanced admin security
**Timeline:** 1 day (after launch)

### 3. Encryption Enforcement
**What:** Auto-encrypt source documents on upload
**Benefit:** Data at rest security
**Timeline:** 1 day (after launch)

### 4. XML Parser Library
**What:** Replace regex XML parsing with xml2js
**Benefit:** Robust WordPress migration handling
**Timeline:** 1 day (Phase 2)

---

## SIGN-OFF AND NEXT STEPS

**Owner Approval Needed:**
1. [ ] Agree to critical path timeline (4-6 weeks)
2. [ ] Decide D-18 (newsletter): Yes / No / Later
3. [ ] Decide D-19 (billing): Yes / No / Later
4. [ ] Authorize MongoDB Atlas account
5. [ ] Authorize email service account

**Once Approved:**
- [ ] Assign blocking items to dev team
- [ ] Begin work on critical path (parallel where possible)
- [ ] Schedule weekly status reviews
- [ ] Plan staging environment setup (Week 3-4)
- [ ] Schedule security audit (Week 5-6)

---

**Prepared By:** Project Team
**Date:** Oct 27, 2026
**Status:** Ready for Owner Decision

