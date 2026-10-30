# Updated Critical Path - Owner's Final Decisions
**Owner Decisions:** Locked in Oct 27, 2026
**Implementation Start:** Monday, Oct 28, 2026
**Target Launch:** Nov 24, 2026 (4 weeks)

---

## YOUR DECISIONS (Locked)

```
✅ Blocker #1: Simple Node.js Cron (not standalone, not Lambda)
✅ Blocker #2: Custom SMTP self-hosted (not SendGrid/SES)
✅ Blocker #3: AI score 80+ minimum (hard fail below)
✅ Blocker #4: MongoDB 8 self-hosted (not Atlas cloud)
✅ Blocker #5: Newsletter auto-send enabled (D-18), no billing (D-19)
```

---

## CRITICAL PATH TIMELINE

### WEEK 1: Blockers Resolution (Oct 28 - Nov 3)

#### 🔴 MONDAY, OCT 28 (Owner Setup Day)
**YOUR ACTIONS (4 hours total):**

1. **Provision MongoDB 8 Server** (1.5 hours)
   - Rent Ubuntu 22.04 VPS (DigitalOcean, Linode, AWS, Vultr, etc.)
   - Recommended specs: 4GB RAM, 2 CPU cores, 50GB SSD ($20-30/month)
   - Install MongoDB 8 following guide in OWNER_BLOCKER_DECISIONS.md
   - Create database users (wpblog_app, wpblog_user)
   - Enable backups (daily dumps to S3 or local storage)
   - Test connection locally

2. **Configure SMTP/Mail Service** (1.5 hours)
   - **Option A (Self-hosted Postfix):**
     - Install on MongoDB VPS or separate server
     - Configure `/etc/postfix/main.cf`
     - Test: `telnet localhost 25`
   - **Option B (Mail Relay):**
     - Sign up for MailerSend ($25/mo) or SendPulse ($19/mo)
     - Get SMTP credentials
     - Configure DNS SPF/DKIM/DMARC records

3. **Create Environment Variables** (1 hour)
   - Generate `.env` with:
     ```
     MONGODB_URL=mongodb://wpblog_app:PASSWORD@your-server:27017/wpblog?authSource=wpblog&retryWrites=true&w=majority
     SMTP_HOST=your-mail-server-ip
     SMTP_PORT=25
     SMTP_FROM_EMAIL=noreply@yourdomain.com
     NEWSLETTER_FROM_EMAIL=newsletter@yourdomain.com
     BASE_URL=https://yourdomain.com
     ```
   - Share with dev team via secure channel (1Password, LastPass, etc.)

4. **Verify Connectivity** (30 min)
   - Test MongoDB: `mongosh "mongodb://..." `
   - Test SMTP: Send test email to yourself
   - Confirm from dev team: "ENV vars received and working"

**Owner Status:** ✅ DONE by end of Monday

---

#### 🟠 TUESDAY-WEDNESDAY, OCT 29-30 (Dev Team: Blockers 1 & 2)

**Dev Team Actions (Both in parallel):**

**TRACK A: Blocker #1 - Job Processor**
- [ ] Create `lib/job-processor.ts` (30 min)
  - Copy from OWNER_BLOCKER_DECISIONS.md
  - Use `node-cron` package
- [ ] Install dependency: `npm install node-cron` (5 min)
- [ ] Add to app startup (5 min)
- [ ] Unit test: Schedule job, wait 70s, verify published (30 min)
- [ ] Code review + merge to main
- **Est. Total:** 1.5 hours

**TRACK B: Blocker #2 - Email Integration**
- [ ] Create `lib/email.ts` (30 min)
  - Copy from OWNER_BLOCKER_DECISIONS.md
  - Use `nodemailer` package
- [ ] Install dependencies: `npm install nodemailer` (5 min)
- [ ] Update `registerReaderLead()`:
  - Add `await sendEmail()` after lead creation (10 min)
  - Test: Register reader, check inbox (15 min)
- [ ] Update `sendNewsletterCampaign()`:
  - Add email loop to all subscribers (20 min)
  - Test: Create 3 test subscribers, send campaign (20 min)
- [ ] Update `confirmNewsletterEmail()`:
  - Already works, just verify (5 min)
- [ ] Code review + merge to main
- **Est. Total:** 2 hours

**BY END OF WED (30 OCT):**
- Job processor running and tested ✅
- Email service integrated and tested ✅
- Both deployed to staging ✅

---

#### 🟡 THURSDAY, OCT 31 (Dev Team: Blockers 3, 5)

**TRACK C: Blocker #3 - Quality Gate (80+ Only)**
- [ ] Update `lib/ai-drafts.ts` (30 min)
  - Copy quality gate code from OWNER_BLOCKER_DECISIONS.md
  - Change threshold: if (evaluation.score < 80) throw error
  - Update console.log messages
- [ ] Update tests (30 min)
  - Mock score 75: Verify error thrown ✓
  - Mock score 85: Verify paper created ✓
- [ ] Run tests: `npm test` (5 min)
- [ ] Code review + merge
- **Est. Total:** 1 hour

**TRACK D: Blocker #5 - Enable D-18 Newsletter**
- [ ] Remove decision gate from `sendNewsletterCampaign()` (20 min)
  - Replace "BLOCKED" code with actual send logic
  - Use `sendEmail()` helper
- [ ] Remove decision gate from `scheduleNewsletterCampaign()` (10 min)
- [ ] Remove D-19 billing code (30 min)
  - Delete all Stripe/payment code
  - Remove billing admin pages
  - Update UI (hide "Upgrade" buttons)
  - Remove BILLING_POLICY constant
- [ ] Update tests (20 min)
- [ ] Verify database schema has NewsletterCampaign, ReaderLead models ✅
- [ ] Code review + merge
- **Est. Total:** 1.5 hours

**BY END OF THU (31 OCT):**
- Quality gate hard fail implemented ✅
- Newsletter auto-send enabled ✅
- Billing code removed ✅
- All code merged to main ✅

---

#### 🟢 FRIDAY, NOV 1 (Dev Team: Integration & Staging Deploy)

**Full Integration Testing:**
- [ ] Run `npm test` (all 27 tests must pass) - 5 min
- [ ] Run `npm run typecheck` (must be clean) - 5 min
- [ ] Run `npm run build` (production build) - 10 min

**End-to-End Smoke Tests (No code changes):**

1. **Reader Signup Flow** (15 min)
   - Register reader lead
   - Verify verification email received ✅
   - Click link, verify email
   - Accept consent
   - Download paper ✅

2. **Content Publishing Flow** (15 min)
   - Create draft
   - Submit for review
   - Reviewer approves (with rights cleared)
   - Admin schedules: "1 minute from now"
   - Wait 70 seconds
   - Verify auto-published ✅

3. **Newsletter Flow** (10 min)
   - Register reader + verify + consent
   - Admin creates campaign
   - Admin sends campaign (no approval needed)
   - Verify reader receives email ✅

4. **AI Generation Flow** (10 min)
   - Upload PDF source
   - Generate AI drafts
   - Verify quality score shown (must be 80+)
   - Verify low-quality rejects ✅

**Staging Deployment:**
- [ ] Deploy all code to staging environment
- [ ] Verify all env vars are set (MONGODB_URL, SMTP_HOST, etc.)
- [ ] Run smoke tests in staging (not local)
- [ ] Verify data persists (post something, refresh, it's there)

**BY END OF FRI (1 NOV):**
- All blockers resolved and tested ✅
- All tests passing (27/27) ✅
- Staging environment live ✅
- Smoke tests all green ✅
- **READY FOR UAT** ✅

---

### WEEK 2: Staging UAT (Nov 4-10)

**Full User Acceptance Testing (All Blockers Live):**

- [ ] Job processor: Schedule 5 posts, all publish on time
- [ ] Email: Verify all verification/newsletter emails arrive
- [ ] Quality gate: Generate 10 papers, all score 80+
- [ ] MongoDB: Data persists across restarts
- [ ] Newsletter: Send campaign to 20+ subscribers
- [ ] Performance: Load test with 100 concurrent users
- [ ] Backups: Verify MongoDB daily backup works

**By Nov 10:**
- ✅ All blockers proven in staging
- ✅ Performance baseline established
- ✅ Backup/restore verified
- ✅ Ready for security audit

---

### WEEK 3-4: Security & Production Prep (Nov 11-24)

**Security Audit (Nov 11-17):**
- Third-party pentesting
- Code security review
- Infrastructure hardening

**Production Deployment Prep (Nov 18-24):**
- DNS configuration
- SSL certificate setup
- Production MongoDB backup policy
- Monitoring + alerting setup
- Incident response plan
- Rollback plan tested

**By Nov 24:**
- ✅ Security audit passed
- ✅ All checks green
- ✅ Ready to launch

---

### WEEK 5: 🚀 LAUNCH (Nov 24+)

**Production Launch:**
- Deploy to production
- Monitor metrics
- Scale as needed
- 🎉 Live!

---

## RESOURCE ALLOCATION

### Owner
- **Week 1, Day 1:** 4 hours (MongoDB + SMTP setup)
- **Rest:** Check-ins only (2-3 hours/week)
- **Total:** ~10 hours

### Dev Team Lead
- **Week 1:** 8 hours/day planning + code review
- **Week 2:** 8 hours/day UAT oversight
- **Week 3-4:** 5 hours/day security + launch prep
- **Total:** ~100 hours

### Dev Team (2 Developers)
- **Week 1:** 40 hours/week (code Blockers 1-5)
- **Week 2:** 40 hours/week (UAT + bug fixes)
- **Week 3:** 30 hours/week (security fixes)
- **Week 4:** 20 hours/week (prod prep)
- **Total:** ~230 hours (5-6 developer-weeks)

### DevOps/Infrastructure
- **Week 1:** 8 hours (MongoDB ops)
- **Week 2-3:** 8 hours/week (monitoring, backups)
- **Week 4:** 16 hours (production infrastructure)
- **Total:** ~40 hours

---

## COST BREAKDOWN

### Infrastructure (Monthly)
- MongoDB VPS: $20-30
- SMTP (Postfix on same VPS): $0
- OR Mail relay service: $19-25
- Total: **$20-55/month**

### One-Time Costs
- Domain registration (if needed): ~$15
- SSL certificate: $0 (Let's Encrypt free)
- Pentesting: $2,000-5,000 (optional for MVP)
- **Total: $0-5,000**

### Team Costs (4 weeks)
- 1 Lead + 2 Devs + 0.5 DevOps
- At $150/hour average: ~$60,000-80,000
- (This is your team cost, already allocated)

**Total for launch:** $20-5,055/month + team allocation

---

## SUCCESS CRITERIA

By Nov 24, 2026:

- ✅ All 5 blockers resolved
- ✅ 27/27 tests passing
- ✅ TypeScript clean
- ✅ All smoke tests green
- ✅ Full UAT passed
- ✅ Security audit passed
- ✅ Monitoring active
- ✅ Backups verified
- ✅ Rollback plan tested
- ✅ Team trained
- ✅ **LAUNCH READY** 🚀

---

## WHAT HAPPENS AFTER LAUNCH (Phase 2)

**Nov 25+:**
- Monitor for issues
- Collect user feedback
- Plan Phase 2 features

**Phase 2 Roadmap:**
- Add MFA to login (already scaffolded)
- Implement APM monitoring (Datadog)
- Upgrade job processor to standalone worker (if needed)
- Add analytics dashboard
- Expand to multiple regions

---

## DECISION CONFIRMATION

**Owner Name:** ___________________________
**Signature:** ___________________________
**Date:** Oct 27, 2026

I confirm:
- [ ] MongoDB 8 self-hosted setup
- [ ] Custom SMTP (Postfix or relay)
- [ ] AI quality gate at 80+ minimum
- [ ] Newsletter auto-send enabled
- [ ] No billing/payment features
- [ ] Dev team can start Monday, Oct 28

---

## NEXT IMMEDIATE ACTION

**Tomorrow, Oct 28:**
1. Owner: Start MongoDB VPS provisioning
2. Dev Team: Get this document + OWNER_BLOCKER_DECISIONS.md
3. Dev Team: Start Blocker #1 & #2 coding
4. Daily standup: 15:00 UTC (track progress)

**By Nov 3:**
- All blockers resolved and tested

**By Nov 10:**
- Full UAT complete

**By Nov 24:**
- Launch ready

**Nov 24+:**
- 🚀 Production launch

---

**Status: READY TO BEGIN**

All decisions locked. Implementation path clear. Team ready. Let's build.

