# Scheduled Auto-Publishing - Implementation Guide

**Feature:** Papers scheduled for publication automatically publish at scheduled time
**Cost Impact:** Saves image generation for papers in DRAFT status
**Status:** Ready to implement

---

## The Problem

### Current Manual Process
```
Step 1: Upload PDF, AI generates content → DRAFT
Step 2: Editorial review & approval → DRAFT (editorialStatus: approved)
Step 3: Schedule publish date (e.g., Oct 31) → DRAFT (scheduledAt: Oct 31)
Step 4: Oct 31 arrives → Still DRAFT
Step 5: Admin manually clicks "Publish" button → PUBLISHED ← Manual!
```

**Issues:**
- ❌ Requires manual action
- ❌ Easy to forget
- ❌ Inconsistent timing
- ❌ Papers sit in draft longer than intended
- ❌ Costs money on cover generation for drafts

---

## The Solution

### Automatic Publishing
```
Step 1: Upload PDF, AI generates content → DRAFT
Step 2: Editorial review & approval → DRAFT (editorialStatus: approved)
Step 3: Schedule publish date (e.g., Oct 31) → DRAFT (scheduledAt: Oct 31)
Step 4: Oct 31 arrives
Step 5: Background job checks → Finds scheduled paper
Step 6: Auto-publishes → PUBLISHED ✅ (automatic!)
Step 7: Generate cover image (now that it's published)
```

**Benefits:**
- ✅ Fully automatic
- ✅ Consistent timing
- ✅ No manual action needed
- ✅ Saves cost (no draft image generation)
- ✅ Papers publish exactly on time

---

## How It Works

### Background Service

A background job runs periodically (every 60 seconds):

```typescript
// Runs in background
Every 60 seconds:
  1. Find papers where:
     - scheduledAt <= NOW (scheduled time has passed)
     - status = "draft" (not yet published)
     - editorialStatus = "approved" (approved by editors)

  2. For each paper:
     - Update status → "published"
     - Generate cover image (if needed)
     - Update updatedAt timestamp
     - Save to database

  3. Log: "Published X papers"
```

### Cost Impact

```
Without auto-publish:
- Paper scheduled but not published yet
- Status still = DRAFT
- If covers generated for drafts → WASTED COST

With auto-publish:
- Paper auto-published on schedule
- Status = PUBLISHED
- Cover generated only for published papers
- No wasted cost ✅
```

---

## Implementation

### 1. Add to Server Startup

In your server initialization (e.g., `app/api/admin/startup/route.ts`):

```typescript
import { startScheduledPublishingService } from "@/lib/scheduled-publishing";

// Start on server boot
export async function POST(request: NextRequest) {
  // ... other startup code ...

  // Start scheduled publishing service
  await startScheduledPublishingService({
    checkIntervalMs: 60_000, // Check every 60 seconds
    enableAutoPublish: true,
    generateCoverOnPublish: true,
  });

  console.log("[Startup] Scheduled publishing service started");

  return NextResponse.json({ status: "ok" });
}
```

### 2. Update Editorial Workflow

In your publishing UI, when user schedules a paper:

```typescript
// Before (manual)
async function publishPaperManually(paperId: string) {
  const paper = await Whitepaper.findByIdAndUpdate(paperId, {
    status: "published",
    updatedAt: new Date().toISOString(),
  });
  return paper;
}

// After (automatic at scheduled time)
async function schedulePaperForPublishing(paperId: string, publishDate: Date) {
  const paper = await Whitepaper.findByIdAndUpdate(paperId, {
    scheduledAt: publishDate.toISOString(),
    // Status stays DRAFT
    // Will auto-publish when scheduledAt is reached
  });

  console.log(
    `Paper scheduled for auto-publish at ${publishDate.toISOString()}`
  );
  return paper;
}
```

### 3. Monitor Service Status

Add endpoint to check service status:

```typescript
// GET /api/admin/scheduled-publishing/status
import { getScheduledPublishingStatus, getScheduledPapersCount } from "@/lib/scheduled-publishing";

export async function GET() {
  const status = getScheduledPublishingStatus();
  const waitingCount = await getScheduledPapersCount();

  return NextResponse.json({
    service: status,
    papersWaitingToPublish: waitingCount,
  });
}
```

---

## Database Schema Requirements

Ensure Whitepaper model has these fields:

```typescript
// lib/models.ts
export interface IWhitepaper {
  // ... existing fields ...

  status: "draft" | "published" | "archived"; // ← Existing
  editorialStatus: "draft" | "in_review" | "approved" | "changes_requested"; // ← Existing
  scheduledAt: string; // ← ISO date string (e.g., "2026-10-31T10:00:00Z")
  updatedAt: string; // ← Last update time

  // ← Add these if missing:
  publishedDate?: string; // When it was actually published
  publishedBy?: string; // Admin who published it
}
```

Database index for efficient queries:

```typescript
whitepaperSchema.index({
  scheduledAt: 1,
  status: 1,
  editorialStatus: 1,
});
```

---

## Cost Optimization: Avoid Generating Covers for Drafts

### Key: Don't generate covers until PUBLISHED

Update `generateDraftsForSource()` in ai-drafts.ts:

```typescript
async function generateDraftsForSource(
  source: SourceDocumentRecord,
  sites: SiteRecord[]
): Promise<PaperRecord[]> {
  // ... AI generates content ...

  for (const site of sites) {
    const content = GeneratedContentSchema.parse(decoded);

    // ← ADD THIS CHECK
    // Don't generate covers for drafts
    if (whitepaper.status !== "published" && !whitepaper.publishedDate) {
      console.log(
        `[Cover Image] Skipped: ${whitepaper.status} (draft, will auto-publish)`
      );
      // Use template for now
      input.coverImageUrl = getTemplateUrl(site, content.category);

      // When paper auto-publishes later, cover will be generated then
      continue;
    }

    // Only generate AI covers for published papers
    const coverResult = await generateCover(content, site, bytes);
    input.coverImageUrl = coverResult.url;

    // ... rest ...
  }
}
```

---

## Workflow Example

### Timeline

```
Oct 1, 9:00 AM
  ↓
Admin uploads "AI in Healthcare.pdf"
  ↓
System generates content (DRAFT)
  ↓
No cover generated (saves $0.08)
  ↓
Use template cover instead (free)

Oct 1, 2:00 PM
  ↓
Editorial team reviews → Approves
  ↓
Admin schedules: Publish on Oct 15
  ↓
Paper saved as:
  - status: "draft"
  - scheduledAt: "2026-10-15T10:00:00Z"
  - editorialStatus: "approved"

Oct 15, 10:00 AM
  ↓
Background service wakes up (every 60 sec)
  ↓
Finds paper where scheduledAt <= NOW
  ↓
Auto-publishes: status → "published"
  ↓
Generates cover ($0.02) ← Only now!
  ↓
Paper visible on website

RESULT: Saved $0.08 by not generating cover for draft ✅
```

---

## Configuration Options

### In Environment Variables

```bash
# Enable auto-publishing
SCHEDULED_PUBLISHING_ENABLED=true

# How often to check (milliseconds)
SCHEDULED_PUBLISHING_CHECK_INTERVAL=60000  # 60 seconds

# Generate covers when publishing
SCHEDULED_PUBLISHING_GENERATE_COVERS=true
```

### Programmatically

```typescript
// Custom config for slow connections (check every 5 min)
startScheduledPublishingService({
  checkIntervalMs: 300_000, // 5 minutes
  enableAutoPublish: true,
  generateCoverOnPublish: true,
});

// Or test config (check every 10 seconds)
startScheduledPublishingService({
  checkIntervalMs: 10_000,
  enableAutoPublish: process.env.NODE_ENV !== "production",
});
```

---

## API Endpoints

### Check Service Status

```bash
GET /api/admin/scheduled-publishing/status

Response:
{
  "service": {
    "running": true,
    "isProcessing": false,
    "interval": 60000
  },
  "papersWaitingToPublish": 5
}
```

### Get Scheduled Papers (Next 7 Days)

```bash
GET /api/admin/scheduled-publishing/upcoming

Response:
[
  {
    "id": "123",
    "title": "AI in Healthcare",
    "scheduledAt": "2026-10-31T10:00:00Z",
    "status": "draft",
    "editorialStatus": "approved"
  },
  // ...
]
```

### Manually Trigger Publish (If Needed)

```bash
POST /api/admin/papers/123/publish-now

Response:
{
  "status": "published",
  "publishedAt": "2026-10-29T15:30:00Z",
  "coverImageUrl": "/api/media/uuid.png"
}
```

---

## Monitoring & Alerts

### Log Monitoring

```bash
# Watch auto-publishing logs
tail -f logs/app.log | grep "Scheduled Publishing"

# Expected output:
# [Scheduled Publishing] Found 5 papers ready to publish
# [Scheduled Publishing] Publishing: AI in Healthcare
# [Scheduled Publishing] Generating cover for: AI in Healthcare
# [Scheduled Publishing] Published: AI in Healthcare
# [Scheduled Publishing] Published 5 papers
```

### Metrics to Track

```typescript
// Create monitoring dashboard
{
  "scheduled_publishing": {
    "papers_waiting": 12,
    "papers_published_today": 5,
    "last_check": "2026-10-29T15:30:00Z",
    "service_uptime": "99.9%",
    "avg_publish_time_ms": 250,
    "errors_today": 0
  }
}
```

### Set Up Alerts

```bash
# Alert if service stops
If scheduled_publishing.service_running = false:
  Send alert: "Scheduled publishing service stopped"

# Alert if papers pile up
If scheduled_publishing.papers_waiting > 50:
  Send alert: "50+ papers waiting to auto-publish"

# Alert on errors
If scheduled_publishing.errors_today > 5:
  Send alert: "Multiple auto-publishing failures"
```

---

## Edge Cases & Handling

### What if paper status is changed?

```typescript
// If admin manually publishes before scheduled time
if (currentStatus === "draft" && newStatus === "published") {
  // Generate cover immediately
  await generateCover(...);

  // Clear scheduled time (already published)
  paper.scheduledAt = "";
}
```

### What if approval is rejected?

```typescript
// If paper set to "changes_requested"
if (editorialStatus === "changes_requested") {
  // Don't publish even if scheduled time passed
  // Skip in query: editorialStatus: "approved"
  console.log("Paper approval rejected, skipping auto-publish");
}
```

### What if server is down at scheduled time?

```typescript
// Service will catch up when it starts
// Query finds papers where:
// - scheduledAt <= NOW (can be in past)
// - status = "draft"
// - editorialStatus = "approved"

// So even if server was down at 10 AM,
// it will publish when it restarts at 2 PM
console.log("Caught up: Publishing 3 papers that passed their time");
```

---

## Cost Impact Summary

### Without Auto-Publishing

```
Upload 100 PDFs (DRAFT)
Generate 100 covers: 100 × $0.08 = $8.00 (waste!)
Only 10 are published later
Cost per published: $8.00 / 10 = $0.80 each
```

### With Auto-Publishing

```
Upload 100 PDFs (DRAFT)
Skip covers for drafts: $0.00 (no waste)
Template covers for drafts: FREE
10 papers approved & scheduled
At publish time: Generate 10 covers = 10 × $0.02 = $0.20
Cost per published: $0.20 / 10 = $0.02 each
Savings: 97.5% ✅
```

---

## Files

- **[lib/scheduled-publishing.ts](lib/scheduled-publishing.ts)** - Auto-publishing service
- **[lib/ai-drafts.ts](lib/ai-drafts.ts)** - Skip covers for drafts (update needed)
- **[IMAGE_GENERATION_COST_OPTIMIZATION.md](IMAGE_GENERATION_COST_OPTIMIZATION.md)** - Cost strategy

---

## Implementation Checklist

- [ ] Add `startScheduledPublishingService()` to server startup
- [ ] Update schema: Verify `scheduledAt` field exists
- [ ] Update AI drafts: Skip covers for DRAFT papers
- [ ] Add monitoring endpoint
- [ ] Test with sample scheduled paper
- [ ] Deploy to staging
- [ ] Verify auto-publish works
- [ ] Deploy to production
- [ ] Monitor logs for issues

---

## Summary

| Feature | Benefit |
|---------|---------|
| **Automatic publishing** | No manual action needed |
| **Scheduled precision** | Publishes exactly on time |
| **Cost optimization** | Skip cover gen for drafts |
| **Background service** | Runs independently |
| **Error tolerant** | Catches up if server down |
| **Monitoring ready** | Full visibility & alerts |

**Result: Better workflows + Lower costs** ✅

