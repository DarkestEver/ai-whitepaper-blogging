# Owner's Blocker Resolution Decisions
**Date:** Oct 27, 2026
**Owner:** Project Owner
**Status:** Decisions Locked - Ready for Implementation

---

## FINAL DECISIONS (Locked In)

### 🟢 BLOCKER #1: Background Job Processor
**Decision:** ✅ **Simple Node.js Cron**
- Implementation: node-cron package, runs every minute
- Cost: $0
- Timeline: 2-3 days
- Scalability: Sufficient for MVP (can upgrade later)

---

### 🟢 BLOCKER #2: Email Service
**Decision:** ✅ **Custom SMTP (Self-Hosted)**
- No SaaS (SendGrid, AWS SES, etc.)
- Run your own mail server
- Options: Postfix, Exim, or mail relay service
- Cost: $0-20/month (if using relay)
- Timeline: 3-5 days to configure

---

### 🟢 BLOCKER #3: AI Quality Gate
**Decision:** ✅ **Minimum Score 80+**
- Score < 80: Hard fail, reject immediately
- Score 80-89: Acceptable, publish
- Score 90+: Excellent, log success
- Cost: $0 (code change only)
- Timeline: 1 day

---

### 🟢 BLOCKER #4: MongoDB
**Decision:** ✅ **MongoDB 8, Self-Hosted**
- Version: MongoDB 8.0+
- Hosting: Self-hosted (your infrastructure)
- Not: MongoDB Atlas cloud
- Cost: VPS/Server costs only
- Timeline: 2-3 days setup + testing

---

### 🟢 BLOCKER #5: Newsletter & Billing
**Decision 1 (D-18 Newsletter):** ✅ **ENABLED - Auto-Send (No Approval)**
- Remove decision gate
- Campaign auto-sends when scheduled
- No admin approval required
- Integrated with SMTP from Blocker #2

**Decision 2 (D-19 Billing):** ✅ **DISABLED - No Billing**
- No payment collection
- No Stripe/Paddle integration
- Free platform only
- Remove all billing code/UI

---

## IMPLEMENTATION GUIDES

### BLOCKER #1: Simple Node.js Cron

Create `lib/job-processor.ts`:

```typescript
/**
 * Publishing Job Processor
 * Runs every minute to process scheduled publication jobs
 */

import cron from 'node-cron';
import { getPendingPublishingJobs, processPublishingJob } from '@/lib/editorial-workflow';

let processorRunning = false;

export function startJobProcessor() {
  if (processorRunning) return;

  processorRunning = true;
  console.log('[Job Processor] Started - running every minute');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      // Get jobs due in next 60 seconds
      const jobs = await getPendingPublishingJobs(60000);

      if (jobs.length === 0) return; // Nothing to do

      console.log(`[Job Processor] Processing ${jobs.length} job(s)...`);

      for (const job of jobs) {
        try {
          console.log(`[Job Processor] Processing job ${job.numericId} (paper ${job.paperId})...`);
          const result = await processPublishingJob(job.numericId);

          if (result.success) {
            console.log(`[Job Processor] ✓ Job ${job.numericId} completed successfully`);
          } else {
            console.warn(`[Job Processor] ⚠ Job ${job.numericId} failed: ${result.message}`);
          }
        } catch (error) {
          console.error(`[Job Processor] ✗ Job ${job.numericId} error:`, error);
        }
      }
    } catch (error) {
      console.error('[Job Processor] Cron error:', error);
    }
  });
}

export function stopJobProcessor() {
  processorRunning = false;
  console.log('[Job Processor] Stopped');
}
```

Add to `app.ts` or entry point:

```typescript
import { startJobProcessor } from '@/lib/job-processor';

// Start job processor when app starts
startJobProcessor();
```

Install dependency:

```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

**Test:**
```typescript
// Schedule a paper for 1 minute from now
const now = new Date();
const scheduledTime = new Date(now.getTime() + 60000); // 1 minute

await scheduleForPublishing(paperId, scheduledTime.toISOString());

// Wait 70 seconds
// Verify paper is published (status="published")
```

---

### BLOCKER #2: Custom SMTP (Self-Hosted)

#### Option A: Postfix/Exim on Your Server (Most Secure)

**Setup on your VPS/server:**

```bash
# Install Postfix
sudo apt-get update
sudo apt-get install postfix mailutils

# Configure: Choose "Internet Site" during setup
sudo systemctl start postfix
sudo systemctl enable postfix

# Verify
postfix start
telnet localhost 25
```

Create `lib/email.ts`:

```typescript
/**
 * Email Service
 * Uses self-hosted SMTP via Nodemailer
 */

import nodemailer from 'nodemailer';

// Create transporter (connects to your Postfix/Exim server)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost', // Your mail server
  port: parseInt(process.env.SMTP_PORT || '25'),
  secure: false, // Use TLS if port 587
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const result = await transporter.sendMail({
      from: options.from || process.env.SMTP_FROM_EMAIL || 'noreply@yourdomain.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    console.log(`[Email] Sent to ${options.to}: ${options.subject} (${result.messageId})`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send to ${options.to}:`, error);
    return false;
  }
}

export async function verifyConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('[Email] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[Email] SMTP connection failed:', error);
    return false;
  }
}
```

Add env vars to `.env`:

```
SMTP_HOST=your-mail-server.com
SMTP_PORT=25
SMTP_FROM_EMAIL=noreply@yourdomain.com
# If auth required:
# SMTP_USER=your_user
# SMTP_PASSWORD=your_password
```

Install dependency:

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

#### Option B: Mail Relay Service (Easier)

If you don't want to manage your own mail server:

**Use a mail relay:**
- **MailerSend**: $25/month, relay or SMTP
- **SendPulse SMTP**: $19/month, SMTP relay
- **SparkPost**: $25/month, SMTP API

Same code above works - just change SMTP credentials.

---

### BLOCKER #3: AI Quality Gate (Score 80+ Only)

Update `lib/ai-drafts.ts`:

```typescript
export async function generateDraftsForSource(source: SourceDocumentRecord, sites: SiteRecord[]): Promise<PaperRecord[]> {
  assertKillSwitchOff("ai");

  if (!source.sourceAsset) {
    throw new FeatureUnavailableError("AI reading requires an uploaded PDF...");
  }

  if (sites.length < 1) throw new Error("No target sites are configured for this source.");

  const bytes = await readSourcePdf(source.sourceAsset.slice("/api/admin/source-files/".length));
  if (!bytes) throw new Error("The uploaded source PDF is missing or invalid...");

  const extracted = await extractPdfText(bytes);
  const configuration = configuredProvider();
  const generated: PaperRecord[] = [];
  const generatedCovers: string[] = [];

  try {
    for (const site of sites) {
      const raw = await requestProviderText(
        configuration.provider,
        configuration.apiKey,
        configuration.model,
        promptFor(extracted.text, site)
      );

      let decoded: unknown;
      try {
        decoded = JSON.parse(raw);
      } catch {
        throw new Error(`AI output for "${site.name}" was not valid JSON. No output was saved.`);
      }

      const content = GeneratedContentSchema.parse(decoded);
      validateCitations(content, extracted.pageCount);

      // 🔴 NEW: Quality Gate - HARD FAIL if score < 80
      const evaluation = evaluateAIOutput(JSON.stringify(decoded));

      if (evaluation.score < 80) {
        throw new Error(
          `AI output quality score too low for ${site.name} (${evaluation.score}/100). ` +
          `Minimum required: 80. Failed checks: ${evaluation.checks
            .filter(c => !c.passed)
            .map(c => c.name)
            .join(', ')}. ` +
          `Please regenerate with better source material.`
        );
      }

      console.log(`[AI Generation] ${site.name}: ✓ Quality score ${evaluation.score}/100`);

      // Continue with existing flow
      const coverImageUrl = await generateCover(content, site);
      if (coverImageUrl) generatedCovers.push(coverImageUrl);

      const input = makePaperInput(content, source, site, coverImageUrl);
      const paper = await createWhitepaper(input);
      generated.push(paper);

      const estimatedTokens = Math.ceil(raw.length / 4);
      const estimatedCost = (estimatedTokens / 1_000_000) * configuration.costPerMTok;
      console.log(
        `[AI Generation] ${site.name}: ${evaluation.score}/100, ` +
        `~${estimatedTokens} tokens, ~$${estimatedCost.toFixed(4)}`
      );
    }

    return generated;
  } catch (error) {
    // Cleanup on error
    for (const paper of generated) {
      try {
        await deleteWhitepaper(paper.id);
      } catch (cleanupError) {
        console.error("Unable to remove partially generated AI draft.", cleanupError);
      }
    }
    for (const cover of generatedCovers) {
      try {
        await removeCoverImage(cover);
      } catch (cleanupError) {
        console.error("Unable to remove partially generated AI cover.", cleanupError);
      }
    }
    throw error;
  }
}
```

**Test:**
```typescript
// Mock low-quality output
const mockEvaluate = jest.spyOn(require('@/lib/ai-evaluation'), 'evaluateAIOutput')
  .mockReturnValue({ score: 65, checks: [] });

// Attempt generation
expect(() => generateDraftsForSource(...)).rejects.toThrow('score too low');

// Mock high-quality output
mockEvaluate.mockReturnValue({ score: 85, checks: [] });

// Should succeed
const result = await generateDraftsForSource(...);
expect(result.length).toBe(1);
```

---

### BLOCKER #4: MongoDB 8 Self-Hosted

#### Installation (Ubuntu/Debian)

```bash
# Add MongoDB repository
curl https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor | sudo tee /usr/share/keyrings/mongodb-server-8.0.gpg >/dev/null

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh
> use admin
> db.version()
8.0.0
```

#### Configure MongoDB

Create `/etc/mongod.conf`:

```yaml
# MongoDB 8.0 Configuration

storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  engine: wiredTiger
  wiredTiger:
    cacheSizeGB: 4  # Adjust based on server RAM

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true

net:
  bindIp: 0.0.0.0
  port: 27017
  ssl:
    mode: requireSSL
    PEMKeyFile: /etc/mongodb/mongod.pem
    CAFile: /etc/mongodb/ca.pem

security:
  authorization: enabled

replication:
  replSetName: rs0  # Required for transactions

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 1000
```

#### Create Database User

```bash
mongosh --authenticationDatabase admin

# In MongoDB shell:
> use admin
> db.createUser({
  user: "wpblog_user",
  pwd: "your_secure_password_here",
  roles: ["readWrite", "dbAdmin"]
})

> use wpblog
> db.createUser({
  user: "wpblog_app",
  pwd: "another_secure_password",
  roles: ["readWrite"]
})
```

#### Update Connection String

In `.env`:

```
MONGODB_URL=mongodb://wpblog_app:another_secure_password@localhost:27017/wpblog?authSource=wpblog&retryWrites=true&w=majority
```

Or with SSL:

```
MONGODB_URL=mongodb://wpblog_app:another_secure_password@localhost:27017/wpblog?authSource=wpblog&ssl=true&retryWrites=true&w=majority
```

#### Verify Connection

```bash
# Test with mongosh
mongosh "mongodb://wpblog_app:another_secure_password@localhost:27017/wpblog"

# From Node.js
npm test # Should pass all tests with DB connection
```

#### Backup Setup

```bash
#!/bin/bash
# Daily backup script (save as /usr/local/bin/backup-mongodb.sh)

BACKUP_DIR=/backups/mongodb
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup all databases
mongodump \
  --uri="mongodb://wpblog_app:password@localhost:27017/wpblog?authSource=wpblog" \
  --out=$BACKUP_DIR/backup_$DATE

# Keep last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

echo "[$(date)] MongoDB backup completed: $BACKUP_DIR/backup_$DATE"
```

Add to crontab:

```bash
crontab -e

# Add line:
0 2 * * * /usr/local/bin/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

---

### BLOCKER #5: Newsletter Auto-Send (D-18 Enabled)

#### Remove Decision Gate from lib/reader-newsletter.ts

Replace this:

```typescript
export async function scheduleNewsletterCampaign(campaignId: number, scheduledFor: string): Promise<boolean> {
  console.log(`[NEWSLETTER] Campaign ${campaignId} scheduled for ${scheduledFor} - BLOCKED: D-18 approval required`);
  return false; // GATED
}

export async function sendNewsletterCampaign(campaignId: number): Promise<{ success: boolean; message: string }> {
  console.log(`[NEWSLETTER] Campaign ${campaignId} send requested - BLOCKED: D-18/D-19 approval required`);
  return { success: false, message: "Newsletter sending gated..." };
}
```

With this:

```typescript
export async function scheduleNewsletterCampaign(
  campaignId: number,
  scheduledFor: string
): Promise<boolean> {
  const campaign = await NewsletterCampaign.findOne({ numericId: campaignId });
  if (!campaign) return false;

  campaign.status = "scheduled";
  campaign.scheduledFor = scheduledFor;
  await campaign.save();

  console.log(`[NEWSLETTER] Campaign ${campaignId} scheduled for ${scheduledFor}`);
  return true;
}

export async function sendNewsletterCampaign(campaignId: number): Promise<{ success: boolean; message: string }> {
  const campaign = await NewsletterCampaign.findOne({ numericId: campaignId });
  if (!campaign) return { success: false, message: "Campaign not found" };

  if (campaign.status === "sending" || campaign.status === "sent") {
    return { success: false, message: "Campaign already sent or sending" };
  }

  try {
    campaign.status = "sending";
    await campaign.save();

    // Get all verified, consented subscribers
    const subscribers = await ReaderLead.find({
      siteId: campaign.siteId,
      isVerified: true,
      consentStatus: "accepted",
    });

    console.log(`[NEWSLETTER] Sending campaign ${campaignId} to ${subscribers.length} subscribers...`);

    let successCount = 0;
    let failureCount = 0;

    for (const subscriber of subscribers) {
      try {
        const unsubscribeLink = `${process.env.BASE_URL}/newsletter/unsubscribe?token=${subscriber.preferences.unsubscribeToken}`;
        const html = `
          ${campaign.contentHtml}
          <hr>
          <p><a href="${unsubscribeLink}">Unsubscribe</a></p>
        `;

        const sent = await sendEmail({
          to: subscriber.email,
          subject: campaign.subject,
          html,
          from: process.env.NEWSLETTER_FROM_EMAIL,
        });

        if (sent) successCount++;
        else failureCount++;
      } catch (error) {
        console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
        failureCount++;
      }
    }

    campaign.status = "sent";
    campaign.sentAt = new Date().toISOString();
    campaign.successCount = successCount;
    campaign.failureCount = failureCount;
    campaign.recipientCount = subscribers.length;
    await campaign.save();

    console.log(`[NEWSLETTER] Campaign ${campaignId} sent: ${successCount} success, ${failureCount} failed`);

    return {
      success: failureCount === 0,
      message: `Sent to ${successCount}/${subscribers.length} subscribers`,
    };
  } catch (error) {
    campaign.status = "failed";
    campaign.lastError = error instanceof Error ? error.message : String(error);
    await campaign.save();

    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

#### Disable D-19 Billing

In `lib/reader-newsletter.ts`:

Remove or comment out:

```typescript
// DISABLED: No billing
export const BILLING_POLICY = {
  active: false,
  scope: "NOT IMPLEMENTED - out of scope",
  // ... rest
};
```

In admin UI, hide billing:
- Remove `/admin/billing` routes
- Hide "Upgrade" buttons
- Remove Stripe integration code

---

## CRITICAL PATH (Updated with Your Decisions)

### Week 1 (Oct 28 - Nov 3)

**Monday (Oct 28):**
- [ ] Owner provisions MongoDB 8 self-hosted server
- [ ] Owner configures Postfix/mail relay service
- [ ] Owner creates database users
- [ ] Dev team gets connection strings + SMTP config

**Tuesday-Wednesday (Oct 29-30):**
- [ ] Dev team: Implement job processor (Blocker #1)
  - Add `lib/job-processor.ts`
  - Start processor on app boot
  - Test with scheduled job
- [ ] Dev team: Wire email service (Blocker #2)
  - Create `lib/email.ts`
  - Update `registerReaderLead()` to send verification email
  - Update `sendNewsletterCampaign()` to send newsletters
  - Test email delivery

**Thursday (Oct 31):**
- [ ] Dev team: Quality gate hard fail at < 80 (Blocker #3)
  - Update `generateDraftsForSource()`
  - Test with low/high scores
- [ ] Dev team: Remove D-18 gate from newsletter
  - Update `sendNewsletterCampaign()`
  - Enable admin UI
  - Test campaign sending
- [ ] Dev team: Remove D-19 billing code
  - Delete payment-related code
  - Hide billing UI

**Friday (Nov 1):**
- [ ] Dev team: Integration testing
  - Database + Email + AI Generation + Newsletter flow
  - End-to-end reader signup → verify → download → newsletter
  - End-to-end content draft → schedule → publish
- [ ] All blockers deployed to staging

**Saturday (Nov 2):**
- [ ] Smoking testing (happy path)
  - Reader signup → email verification → access content
  - Editor draft → submit → reviewer approve → schedule → auto-publish
  - Admin create newsletter → send to all subscribers

---

### Week 2 (Nov 4-10)

**Full UAT in staging:**
- Test job processor at scale
- Test email delivery with multiple recipients
- Test newsletter campaigns
- Verify MongoDB backups work
- Load test (100 concurrent users)

---

## FINAL CHECKLIST

### For Owner
- [ ] Provision MongoDB 8 server (VPS/dedicated machine)
- [ ] Configure Postfix or mail relay service
- [ ] Create database + users
- [ ] Create SMTP account
- [ ] Provide connection strings to dev team
- [ ] Enable D-18 (newsletter auto-send)
- [ ] Confirm D-19 disabled (no billing)

### For Dev Team
- [ ] Install node-cron + nodemailer
- [ ] Implement job processor (Blocker #1)
- [ ] Wire email service (Blocker #2)
- [ ] Make quality gate hard fail (Blocker #3)
- [ ] Remove D-18 gate (enable newsletter)
- [ ] Remove D-19 code (disable billing)
- [ ] Test all blockers together
- [ ] Deploy to staging
- [ ] Run full UAT

---

## ENV VARIABLES NEEDED

```
# MongoDB
MONGODB_URL=mongodb://wpblog_app:password@your-server:27017/wpblog?authSource=wpblog&retryWrites=true&w=majority

# Email/SMTP
SMTP_HOST=your-mail-server.com
SMTP_PORT=25
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_USER=optional_if_auth_needed
SMTP_PASSWORD=optional_if_auth_needed

# Newsletter
NEWSLETTER_FROM_EMAIL=newsletter@yourdomain.com
BASE_URL=https://yourdomain.com

# AI (existing)
AI_PROVIDER=anthropic
AI_API_KEY=sk-...
AI_MODEL=claude-sonnet-4-20250514
```

---

## TIMELINE SUMMARY

| Task | Owner | Timeline | Status |
|------|-------|----------|--------|
| MongoDB 8 provision | Owner | Oct 28 | Pending |
| Mail relay setup | Owner | Oct 28 | Pending |
| Job processor | Dev | Oct 29-30 | Pending |
| Email integration | Dev | Oct 29-30 | Pending |
| Quality gate (80+) | Dev | Oct 31 | Pending |
| D-18 enable | Dev | Oct 31 | Pending |
| D-19 disable | Dev | Oct 31 | Pending |
| Integration test | Dev | Nov 1 | Pending |
| Staging deployment | Dev | Nov 1-2 | Pending |
| Full UAT | All | Nov 4-10 | Pending |
| Security audit | All | Nov 11-17 | Pending |
| **Launch** | All | **Nov 24+** | **Ready** |

---

**Status:** ✅ All decisions locked. Ready for implementation.

**Next:** Share this document with dev team. Begin immediately Monday, Oct 28.

