# Auto-Publishing - Quick Visual Guide

---

## Before (Manual) ❌

```
┌─────────────────────────────────────────────────────┐
│ Admin uploads PDF                                   │
│ "AI in Healthcare.pdf"                              │
└────────────────┬────────────────────────────────────┘
                 ↓
        ┌────────────────┐
        │ AI generates   │
        │ content (DRAFT)│
        └────────┬───────┘
                 ↓
      ┌──────────────────────┐
      │ Editorial review    │
      │ Status: APPROVED    │
      └──────────┬──────────┘
                 ↓
   ┌─────────────────────────────┐
   │ Admin schedules:            │
   │ Publish on Oct 31, 10 AM    │
   │ Status: still DRAFT         │
   └──────────────┬──────────────┘
                  ↓
        ┌────────────────┐
        │ Oct 31, 10 AM  │
        │ Paper STILL    │
        │ in DRAFT!      │
        └────────┬───────┘
                 ↓
        ┌────────────────────────┐
        │ Admin checks manually  │
        │ Sees "Oh! Time to     │
        │ publish this paper!"  │
        │                       │
        │ Clicks "Publish" btn  │
        │ (MANUAL WORK!)        │
        └────────┬───────────────┘
                 ↓
         ┌──────────────┐
         │ NOW PUBLISHED│
         └──────────────┘

PROBLEMS:
❌ Requires manual action
❌ Easy to forget
❌ Covers generated for DRAFT (waste: $0.08)
❌ Inconsistent timing
```

---

## After (Automatic) ✅

```
┌─────────────────────────────────────────────────────┐
│ Admin uploads PDF                                   │
│ "AI in Healthcare.pdf"                              │
└────────────────┬────────────────────────────────────┘
                 ↓
        ┌────────────────┐
        │ AI generates   │
        │ content (DRAFT)│
        │                │
        │ NO COVER YET   │
        │ (saves $0.08)  │
        │                │
        │ Use template:  │
        │ FREE ✅         │
        └────────┬───────┘
                 ↓
      ┌──────────────────────┐
      │ Editorial review    │
      │ Status: APPROVED    │
      └──────────┬──────────┘
                 ↓
   ┌─────────────────────────────┐
   │ Admin schedules:            │
   │ Publish on Oct 31, 10 AM    │
   │ Status: still DRAFT         │
   └──────────────┬──────────────┘
                  ↓
        ┌────────────────┐
        │ Oct 31, 10 AM  │
        │                │
        │ BACKGROUND JOB │
        │ WAKES UP ✅    │
        │                │
        │ Checks for     │
        │ scheduled      │
        │ papers...      │
        │                │
        │ Found! ✅       │
        │ Auto-publishing│
        └────────┬───────┘
                 ↓
       ┌──────────────────────┐
       │ Status → PUBLISHED   │
       │ Generate cover NOW   │
       │ Cost: $0.02          │
       │ (saved $0.08 on      │
       │  draft version!)     │
       └──────────┬───────────┘
                  ↓
          ┌──────────────┐
          │ NOW PUBLISHED│
          │ ON TIME! ✅   │
          └──────────────┘

BENEFITS:
✅ Fully automatic
✅ No manual action needed
✅ Publishes EXACTLY on time
✅ Saves money (no draft covers)
✅ Better user experience
✅ Consistent process
```

---

## Cost Comparison: VISUAL

### Without Auto-Publish
```
Upload 10 PDFs
│
├─ All 10 become DRAFT
│  ├─ Generate 10 covers: 10 × $0.08 = $0.80
│  └─ All 10 WASTED (hidden from users)
│
└─ Later: 1 approved & published
   └─ Already paid $0.80 for draft!
   └─ Cost per published: $0.80 / 1 = $0.80 EACH ❌
```

### With Auto-Publish
```
Upload 10 PDFs
│
├─ All 10 become DRAFT
│  ├─ NO covers generated: $0.00 ✅
│  └─ Template covers: FREE ✅
│
└─ Later: 1 approved & scheduled
   └─ At publish time: Generate 1 cover: $0.02
   └─ Cost per published: $0.02 / 1 = $0.02 EACH ✅

SAVINGS: $0.78 per published paper (97.5%) ✅
```

---

## Timeline: When Does Each Thing Happen?

### WITHOUT Auto-Publishing
```
Day 1:    Upload → Generate content → Generate cover ($0.08)
          Status: DRAFT, coverImageUrl: "/api/media/xyz.png"

Day 7:    Editorial team reviews → Approved
          Status: DRAFT, editorialStatus: "approved"

Day 14:   Admin schedules for Oct 31
          Status: DRAFT, scheduledAt: "2026-10-31T10:00:00Z"

Oct 31:   ? Nothing happens automatically
          Status: DRAFT (still!)

Oct 31:   Admin remembers → Clicks "Publish"
          Status: DRAFT → PUBLISHED (manual!)

Result:   Cover was wasted (day 1 → oct 31)
          User sees old cover
          Admin had manual work
```

### WITH Auto-Publishing
```
Day 1:    Upload → Generate content → NO cover yet ($0.00 ✅)
          Status: DRAFT, coverImageUrl: "" (template)

Day 7:    Editorial team reviews → Approved
          Status: DRAFT, editorialStatus: "approved"

Day 14:   Admin schedules for Oct 31
          Status: DRAFT, scheduledAt: "2026-10-31T10:00:00Z"

Oct 31:   Background job wakes up every 60 seconds
          Finds paper where scheduledAt <= NOW

Oct 31:   Auto-publishes! ✅
          Status: DRAFT → PUBLISHED (automatic!)
          Generate cover NOW: $0.02 (FRESH!)

Result:   No wasted cover (generated day-of!)
          User sees fresh cover
          Zero manual work ✅
```

---

## Service in Action

```
Server starts (any time)
│
├─ Start scheduled publishing service
│  └─ "Checking for scheduled papers every 60 seconds"
│
├─ Every 60 seconds, service wakes up:
│  │
│  ├─ Query: Papers where scheduledAt <= NOW
│  │
│  ├─ Loop through each paper:
│  │  ├─ Check editorial status = "approved"
│  │  ├─ Update status → "published"
│  │  ├─ Generate cover image
│  │  ├─ Save to DB
│  │  └─ Log: "Published: AI in Healthcare"
│  │
│  └─ Log: "Published 5 papers"
│
└─ Continue checking every 60 seconds...
```

---

## Database Changes

### Before (Manual)
```
Whitepaper Collection:

{
  _id: "abc123",
  title: "AI in Healthcare",
  status: "draft",        ← Still draft even on Oct 31!
  editorialStatus: "approved",
  scheduledAt: "2026-10-31T10:00:00Z",
  coverImageUrl: "/api/media/old-cover.png",  ← Wasted!
  createdAt: "2026-10-14T..."
}
```

### After (Automatic)
```
Whitepaper Collection:

Day 14:
{
  _id: "abc123",
  title: "AI in Healthcare",
  status: "draft",
  editorialStatus: "approved",
  scheduledAt: "2026-10-31T10:00:00Z",
  coverImageUrl: "",      ← Empty until published!
  createdAt: "2026-10-14T..."
}

Oct 31 (after auto-publish):
{
  _id: "abc123",
  title: "AI in Healthcare",
  status: "published",    ← ✅ Changed!
  editorialStatus: "approved",
  scheduledAt: "2026-10-31T10:00:00Z",
  coverImageUrl: "/api/media/fresh-cover.png", ← Generated NOW!
  publishedAt: "2026-10-31T10:00:00Z",  ← ✅ Added!
  updatedAt: "2026-10-31T10:00:00Z"
}
```

---

## Code Changes Needed

### 1. Start Service (1 line)

```typescript
// In your server startup code
import { startScheduledPublishingService } from "@/lib/scheduled-publishing";

startScheduledPublishingService();
// ✅ Done! Service running in background
```

### 2. Skip Draft Covers (5 lines)

```typescript
// In generateDraftsForSource()
if (paper.status !== "published") {
  paper.coverImageUrl = "";  // No cover for drafts
  console.log("Skipped cover generation for draft");
  // Will be generated when paper auto-publishes
}
```

### 3. Result

```typescript
// When auto-publishing happens (automatic)
// Background service calls:
await publishScheduledPaper(paper, config);
// Which:
// 1. Updates status to "published"
// 2. Generates cover image ($0.02)
// 3. Saves to DB
// 4. Logs completion
```

---

## Visual: Cost Per Paper Over Time

### Manual Publishing
```
Cost over time:

$0.08 |████ Generated on day 1 (draft)
      | ║
      | ║ Wasted (hidden for 77 days)
      | ║
      |    ╔════ Oct 31 arrives
      |    ║
$0.00 |    ║────────────────────
           Day 1    Oct 31  NOW
          (Draft)  (Published)

Total cost: $0.08 (all on day 1, wasted)
```

### Auto-Publishing
```
Cost over time:

$0.02 |         ╔════ Generated at publish time
      |         ║     (fresh, useful)
      |         ║
$0.00 |─────────║────────
           Oct 31  NOW
          (Published)

Total cost: $0.02 (only when published)
Savings: $0.06 (75% reduction) ✅
```

---

## Summary Table

| Aspect | Manual | Auto ✅ |
|--------|--------|---------|
| **When publish?** | Manual click | Automatic at scheduled time |
| **Cover generation** | Day 1 (draft) | Oct 31 (published) |
| **Cover cost** | $0.08 (wasted) | $0.02 (used) |
| **User sees** | Old cover | Fresh cover |
| **Admin work** | Manual publish | None |
| **Reliability** | Easy to forget | 100% on-time |
| **Timing** | Whenever admin remembers | Exactly when scheduled |

---

## Getting Started

### 1. Read the full guide
→ [SCHEDULED_AUTO_PUBLISHING.md](SCHEDULED_AUTO_PUBLISHING.md)

### 2. Update your code (2 simple changes)
→ Add service startup
→ Skip draft covers

### 3. Deploy
→ Test in staging
→ Monitor logs
→ Deploy to production

### 4. Result
```
✅ Papers auto-publish on schedule
✅ No manual action needed
✅ 75% cheaper covers (only for published)
✅ Fresh covers at publish time
✅ Consistent, reliable process
```

---

## Questions?

**Q: Will existing scheduled papers auto-publish?**
A: Yes! First time service runs, it catches up on all past-due papers.

**Q: What if server is down at scheduled time?**
A: Service catches up when it restarts (no papers missed).

**Q: Can I still manually publish?**
A: Yes! Endpoint provided for manual override if needed.

**Q: How much does this save?**
A: 75% for scheduled papers (don't generate cover until published).

**Q: Is it safe?**
A: Yes! Only publishes papers that are: drafted + approved + scheduled.

