# Owner Decisions Required for Production Launch

**Project:** wpblog Platform (Owned Multi-Site Publisher)
**Status:** UAT Complete - Awaiting Owner Decisions
**Date:** Oct 27, 2026

---

## EXECUTIVE SUMMARY

The platform is **fully implemented and tested** (27/27 tests passing). To reach production, 5 blocking issues must be resolved. This document outlines the owner's key decisions and their implications.

**Timeline Impact:** Owner decisions made today = Production ready in 4-6 weeks.

---

## CRITICAL DECISION #1: BACKGROUND JOB PROCESSOR

**Question:** How should the platform process scheduled content publishing?

### Current Situation
- Editorial workflow creates "approved" content
- Admin schedules publication (future datetime)
- Job queue stores jobs but **no daemon processes them**
- **Result:** Scheduled content never publishes

### Your Options

#### Option A: Simple Node Cron (Recommended for MVP)
**How it works:**
- Node.js cron job runs every minute
- Checks for jobs due in next 60 seconds
- Processes one job at a time
- Uses existing processPublishingJob() function (idempotent)

**Pros:**
- ✅ Simple (2-3 day implementation)
- ✅ No additional infrastructure
- ✅ Runs on existing app server
- ✅ Cost: $0

**Cons:**
- ❌ Single point of failure (if server down, jobs delayed)
- ❌ Doesn't scale to multiple servers
- ❌ Manual restart required if cron dies

**Cost:** $0
**Timeline:** 2-3 days
**Effort:** Low

#### Option B: Standalone Worker Service
**How it works:**
- Separate Node.js process (could be same server, different port)
- Listens to database change streams OR polls periodically
- Can scale to multiple workers
- Restart-safe with database as source of truth

**Pros:**
- ✅ Scales to multiple workers
- ✅ Survives server restarts
- ✅ Better for production
- ✅ Can monitor health separately

**Cons:**
- ❌ More complex (5-7 day implementation)
- ❌ Additional infrastructure to manage
- ❌ Requires monitoring/alerting

**Cost:** $0 (can run on same server)
**Timeline:** 5-7 days
**Effort:** Medium

#### Option C: AWS Lambda (Cloud Native)
**How it works:**
- Serverless function triggered by CloudWatch Events (every minute)
- Queries due jobs, processes them
- Scales automatically
- Pay per execution

**Pros:**
- ✅ Fully managed (no ops burden)
- ✅ Auto-scales
- ✅ Very reliable
- ✅ No server management

**Cons:**
- ❌ AWS account required
- ❌ Cold starts (100-500ms overhead)
- ❌ Overkill for MVP
- ❌ Cost: ~$1-5/month (variable)

**Cost:** $1-5/month
**Timeline:** 3-4 days
**Effort:** Medium

### Recommendation
**For MVP/Launch:** Option A (Simple Cron)
- Fast to implement
- No additional infrastructure
- Sufficient for launch
- Can upgrade to Option B later

**For Scale (Post-Launch):** Option B (Standalone Worker)
- Implement after you have users
- Better reliability at scale
- No migration needed (same interface)

### Your Decision
```
[ ] A - Simple Cron (MVP, fast)
[ ] B - Standalone Worker (production-grade)
[ ] C - AWS Lambda (cloud-native)
```

---

## CRITICAL DECISION #2: EMAIL SERVICE PROVIDER

**Question:** Which email service will send reader verification and newsletter emails?

### Your Options

#### Option A: AWS SES (Recommended)
**What:** Amazon Simple Email Service
**Setup:** 15 minutes
**Cost:** ~$0.10 per 1,000 emails

**Pros:**
- ✅ Cheapest option
- ✅ AWS-native (already familiar?)
- ✅ Reliable
- ✅ No templates included (simple)

**Cons:**
- ❌ Limited email templates
- ❌ No built-in UI
- ❌ Needs code for all logic
- ❌ Limited analytics

**Best For:** Cost-conscious, technical team

#### Option B: SendGrid (Recommended for Features)
**What:** Industry-standard email platform
**Setup:** 30 minutes
**Cost:** ~$20/month (up to 100K emails/month)

**Pros:**
- ✅ Beautiful templates UI
- ✅ Detailed analytics (opens, clicks)
- ✅ Reputation management
- ✅ Excellent support

**Cons:**
- ❌ More expensive than SES
- ❌ Higher minimum spend
- ❌ More complex integration

**Best For:** Newsletter-focused, non-technical team

#### Option C: Brevo (formerly Sendinblue)
**What:** European email service
**Setup:** 20 minutes
**Cost:** Free tier (up to 300/day), then €20/month

**Pros:**
- ✅ Free tier included
- ✅ Good for SMB
- ✅ Simple setup
- ✅ European GDPR-compliant

**Cons:**
- ❌ Smaller platform (less featured)
- ❌ Smaller community
- ❌ Limited analytics

**Best For:** Budget-conscious, GDPR-first

#### Option D: Mailgun
**What:** Developer-friendly email API
**Setup:** 30 minutes
**Cost:** $25/month (50K emails/month)

**Pros:**
- ✅ Developer-friendly API
- ✅ Great documentation
- ✅ Webhooks for tracking
- ✅ Good for automation

**Cons:**
- ❌ Expensive
- ❌ Minimal UI
- ❌ Need to code everything

**Best For:** API-first, developers

### Emails You Need to Send

1. **Reader Lead Verification**
   - Frequency: ~1-10 per day (Phase 1)
   - Template: Simple (just a link)
   - Volume: Small

2. **Newsletter Campaigns** (IF D-18 approved)
   - Frequency: 1-4 per month
   - Template: Content + unsubscribe link
   - Volume: Depends on subscribers (100-10K)

### Recommendation
**For MVP:** AWS SES
- Cheapest ($0-10/month)
- Sufficient for Phase 1
- Easy migration to SendGrid later

**If budget allows:** SendGrid
- Better experience
- Built-in templates
- Better analytics for newsletters

### Your Decision
```
[ ] A - AWS SES (cheapest)
[ ] B - SendGrid (best features)
[ ] C - Brevo (budget + free tier)
[ ] D - Mailgun (developer-friendly)
```

---

## CRITICAL DECISION #3: DATABASE SETUP

**Question:** Where should MongoDB be hosted?

### Your Options

#### Option A: MongoDB Atlas Free Tier (Recommended for MVP)
**What:** MongoDB's managed cloud service
**Setup:** 30 minutes
**Cost:** Free (512 MB, shared cluster)

**Specs:**
- Storage: 512 MB
- Connections: 100 concurrent
- Backup: Daily
- SSL/TLS: Included
- Regions: Global

**Pros:**
- ✅ Completely free
- ✅ No ops burden
- ✅ Automatic backups
- ✅ Easy to upgrade

**Cons:**
- ❌ Limited storage (512 MB)
- ❌ Shared cluster (noisy neighbors)
- ❌ No dedicated support
- ❌ Enough for ~100K documents

**Limit for:** MVP with <1M users

#### Option B: MongoDB Atlas Paid Tier
**What:** Dedicated M2/M5 clusters
**Setup:** 1 hour
**Cost:** ~$57/month (M2 dedicated, 10GB)

**Specs:**
- Storage: 10-100 GB
- Connections: 500-1000
- Backup: Automated, hourly
- SSL/TLS: Included
- Monitoring: Built-in

**Pros:**
- ✅ Dedicated resources
- ✅ Better performance
- ✅ Priority support
- ✅ Scales easily

**Cons:**
- ❌ $57-500/month
- ❌ Still managed (no control)
- ❌ Overkill for MVP

**Limit for:** Post-launch with 10K+ users

#### Option C: Self-Hosted MongoDB
**What:** Run MongoDB on your own VPS
**Setup:** 2-4 hours
**Cost:** ~$20-50/month (VPS) + ops time

**Specs:**
- Storage: Unlimited
- Performance: Dedicated
- Backup: Your responsibility
- Support: Community only

**Pros:**
- ✅ Full control
- ✅ Potentially cheaper at scale
- ✅ Custom security

**Cons:**
- ❌ Ops burden (backups, security, scaling)
- ❌ No high availability by default
- ❌ Disaster recovery is your problem
- ❌ Not recommended for MVP

**Limit for:** Not recommended, unless you have DevOps team

### Recommendation
**For MVP/Launch:** MongoDB Atlas Free Tier
- Completely free
- No ops work
- 512 MB is enough for ~100K posts
- Easy to upgrade when needed
- 30-minute setup

**After Launch (10K+ users):** Upgrade to Atlas M2 ($57/month)

### Your Decision
```
[ ] A - MongoDB Atlas Free Tier (recommended)
[ ] B - MongoDB Atlas Paid M2/M5 (post-launch)
[ ] C - Self-hosted MongoDB (not recommended)
```

---

## STRATEGIC DECISION #4: NEWSLETTER POLICY (D-18)

**Question:** Should the platform send newsletters to readers?

### Current Status
- Newsletter infrastructure is 100% implemented
- All functions are gated behind D-18 decision
- **Currently:** Blocked, no emails sent

### If You Say YES
**Implications:**
- Enable sendNewsletterCampaign() and scheduleNewsletterCampaign()
- Wire to email service (sendEmail helper)
- Admins can send campaigns to subscribers
- Readers get opt-in/unsubscribe flows
- Legal requirement: Privacy policy update

**Timeline:** 1-2 days (once email service is set up)
**Cost:** Email service cost only
**Effort:** Low (framework already built)

#### What Readers Will See
1. Newsletter subscription opt-in
2. Confirmation email with verify link
3. Preference page (frequency, topics)
4. Email confirmation
5. Newsletters with one-click unsubscribe

### If You Say NO
**Implications:**
- Remove newsletter UI from product
- Delete reader newsletter preference pages
- Customer communications only via email
- Lose reader engagement channel

**Timeline:** Immediate (rip out code)
**Cost:** $0 (no email service needed)
**Effort:** Medium (remove from UI/API)

### If You Say LATER
**Implications:**
- Launch without newsletter feature
- Implement in Phase 2 (after user feedback)
- MVP is content discovery + free access
- Add newsletter when you understand user needs

**Timeline:** 4-8 weeks post-launch
**Cost:** Email service cost (later)
**Effort:** Same as YES (build then)

### Recommendation
**For MVP Launch:** LATER
- Get users first
- Understand engagement needs
- Add newsletter after Phase 1
- Reduces launch complexity

### Your Decision
```
[ ] YES - Enable newsletters now
[ ] NO - Remove entirely
[ ] LATER - Implement in Phase 2 (recommended)
```

---

## STRATEGIC DECISION #5: PAID BILLING MODEL (D-19)

**Question:** Will the platform accept payment from customers?

### Current Status
- Billing infrastructure is scaffolded but **NOT IMPLEMENTED**
- All payment functions are gated behind D-19
- **Currently:** Out of scope, no payment collection code

### If You Say YES
**Implications:**
- Implement billing integration (Stripe/Paddle)
- Legal review (Terms of Service, Privacy Policy)
- PCI compliance (payment security)
- Tax handling (sales tax, VAT)
- Accounting/invoicing
- Customer support for billing issues
- Recurring subscription logic

**Timeline:** 4-6 weeks
**Cost:** Stripe/Paddle 2-3% per transaction
**Effort:** Very High (legal, ops, code)
**Risk:** High (PCI, legal, customer support)

#### Example Paid Plans
```
Free Plan:
- 1 published paper per month
- Limited readers

Pro Plan ($49/month):
- Unlimited published papers
- Up to 10,000 readers
- Email newsletters
- Advanced analytics

Enterprise ($499+/month):
- Dedicated support
- Custom integrations
- SLA guarantees
```

### If You Say NO
**Implications:**
- Platform is free forever (or freemium later)
- No payment collection
- No billing support
- Revenue model is elsewhere (ads, sponsorship, grants)
- Simpler product (no subscription logic)

**Timeline:** Immediate
**Cost:** $0
**Effort:** Low (nothing to implement)
**Opportunity:** Different revenue model later

### If You Say LATER
**Implications:**
- Launch free platform
- Build user base first
- Add billing after 1K-10K users
- Learn customer WTP (willingness to pay)
- Implement Phase 2

**Timeline:** 3-4 months post-launch
**Cost:** Stripe/Paddle setup later
**Effort:** Can be done post-launch
**Benefit:** Validate market first

### Recommendation
**For MVP Launch:** LATER (or NO)
- Launch free platform first
- Build user base
- Understand willingness to pay
- Add billing after validating market
- Reduces launch complexity and risk

### Your Decision
```
[ ] YES - Implement billing before launch (4-6 weeks more)
[ ] NO - Free platform forever
[ ] LATER - Free MVP, add billing in Phase 2 (recommended)
```

---

## DECISION SUMMARY TABLE

| Decision | Recommendation | Timeline Impact | Cost Impact |
|----------|---|---|---|
| Job Processor | Option A (Cron) | +2-3 days | $0 |
| Email Provider | AWS SES | +3-4 days | $0-10/mo |
| Database | Atlas Free | +30 min | $0 |
| Newsletter (D-18) | LATER | $0 impact | $0 impact |
| Billing (D-19) | LATER | $0 impact | $0 impact |

**If you choose all recommendations above:**
- Launch Timeline: 4-6 weeks
- Blockers complete: ~2 weeks
- UAT + Security: ~2 weeks
- Launch: ~1 week
- Total cost (ops): $0-10/month

---

## OWNER DECISION FORM

**Please complete and sign:**

```
PROJECT: wpblog Platform
OWNER: _______________________________
DATE: ________________________________

DECISION 1: Background Job Processor
[ ] A - Simple Cron (recommended)
[ ] B - Standalone Worker
[ ] C - AWS Lambda

DECISION 2: Email Service
[ ] A - AWS SES (recommended)
[ ] B - SendGrid
[ ] C - Brevo
[ ] D - Mailgun

DECISION 3: Database
[ ] A - MongoDB Atlas Free (recommended)
[ ] B - MongoDB Atlas Paid
[ ] C - Self-hosted

DECISION 4: Newsletter (D-18)
[ ] YES
[ ] NO
[ ] LATER (recommended)

DECISION 5: Billing (D-19)
[ ] YES
[ ] NO
[ ] LATER (recommended)

SIGNATURE: ____________________________

Authorized to:
- [ ] Proceed with development (decisions made)
- [ ] Defer decisions (delay 1 week)
- [ ] Require additional analysis
```

---

## NEXT STEPS (Once Signed)

**Day 1:**
1. [ ] Sign decision form
2. [ ] Share with dev team
3. [ ] Dev team starts Job Processor (Option A)

**Day 2-3:**
4. [ ] Owner creates MongoDB Atlas account
5. [ ] Owner sets up email service (your choice)
6. [ ] Get credentials to dev team

**Day 4-7:**
7. [ ] Background job processor complete
8. [ ] Email integration complete
9. [ ] All systems integrated + tested

**Week 2:**
10. [ ] Full integration testing
11. [ ] Staging environment ready
12. [ ] Begin security audit

**Week 4:**
13. [ ] Security audit complete
14. [ ] Production infrastructure ready
15. [ ] Launch!

---

**Prepared by:** Project Team
**Status:** Awaiting Owner Signature
**Validity:** 7 days (decisions should be made by Nov 3, 2026)

