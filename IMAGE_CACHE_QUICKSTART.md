# Image Caching - Quick Start

## ✅ TL;DR

**Automatic caching is already enabled!**

```typescript
// No configuration needed - works out of the box
const coverResult = await generateCover(content, site, bytes);
// If content is similar to past PDFs → Returns cached image (instant)
// If new content → Calls API, caches result for next time
```

**Expected savings:**
```
100 papers/month
Without cache: $8.00
With cache (40% hit rate): $4.80
Savings: $3.20/month ✅
```

---

## How It Works

```
1️⃣ Generate cover
   ↓
2️⃣ Check cache: Have we seen this content before?
   ↓
   YES: Return cached image ⚡ (instant)
   NO:  Continue ↓
   ↓
3️⃣ Call OpenAI API ($0.08)
   ↓
4️⃣ Save to cache (memory + disk)
   ↓
5️⃣ Return cover
```

---

## Cache Hits Example

```
Scenario: Multiple papers about "AI in Healthcare" from same site

Paper 1: "AI in Healthcare" → API call ($0.08) ← First time
Paper 2: "AI in Healthcare" → CACHE HIT ✅ ($0.00) ← Free!
Paper 3: "AI in Healthcare" → CACHE HIT ✅ ($0.00) ← Free!
Paper 4: "AI in Healthcare" → CACHE HIT ✅ ($0.00) ← Free!

Cost: $0.08 instead of $0.32 (75% savings)
```

---

## What Gets Cached

✅ **Cached:**
- AI-generated covers
- PDF screenshot covers (when implemented)
- Cover URL + metadata

❌ **NOT cached:**
- PDFs themselves
- Generated content (title, summary, etc.)
- Database records

---

## Logging

Watch for cache messages in logs:

```
[Image Cache] HIT (memory): a1b2c3d4           ← Served from memory (1-5ms)
[Image Cache] HIT (disk): b2c3d4e5             ← Served from disk (10-50ms)
[Image Cache] MISS: c3d4e5f6                   ← Cache miss, calling API
[Image Cache] SAVED: d4e5f6g7 (expires: 30d)   ← Result cached for 30 days
[Image Cache] Hit ratio: 42.5%                 ← Performance metric
```

---

## Configuration

### Enable/Disable

```bash
# Enable caching (DEFAULT - no action needed)
export IMAGE_CACHE_ENABLED=true

# Disable caching (not recommended)
export IMAGE_CACHE_ENABLED=false
```

### Cache TTL

Default: **30 days** (automatically managed)

To customize:
```typescript
// In lib/ai-drafts.ts
await cacheImage(title, summary, site, imageUrl, source, ttlDays=45);
```

---

## Storage

**Location:** `.data/cache/images/`

**Example:**
```
.data/cache/images/
├── a1b2c3d4e5f6g7h8.json   (Cache entry 1)
├── b2c3d4e5f6g7h8i9.json   (Cache entry 2)
└── c3d4e5f6g7h8i9j0.json   (Cache entry 3)
```

**Typical size:** 1-5 MB for 100-500 cached covers

---

## Performance

### Cache Hit (Memory)
- Time: **1-5ms** ⚡ (instant)
- Cost: **$0**

### Cache Hit (Disk)
- Time: **10-50ms** (fast)
- Cost: **$0**

### Cache Miss
- Time: **30-60s** (API latency)
- Cost: **$0.08**

---

## Monitoring

### Check hit ratio

```typescript
import { getCacheHitRatio } from "@/lib/image-cache";

const ratio = await getCacheHitRatio();
console.log(`Cache hit ratio: ${ratio}`); // "42.5%"
```

### Get detailed stats

```typescript
import { getCacheStats } from "@/lib/image-cache";

const stats = await getCacheStats();
console.log({
  hits: stats.hits,
  misses: stats.misses,
  hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
  totalEntries: stats.totalEntries,
  cacheSizeBytes: stats.cacheSize,
});
```

---

## Manual Cache Operations

### Check if cached

```typescript
import { getCachedImage } from "@/lib/image-cache";

const cached = await getCachedImage(title, summary, site);
if (cached) {
  console.log(`Using cached: ${cached.url}`);
}
```

### Manually save to cache

```typescript
import { cacheImage } from "@/lib/image-cache";

await cacheImage(
  title,
  summary,
  site,
  "/api/media/uuid.png",
  "ai-generated"
);
```

### Clear all cache

```typescript
import { clearCache } from "@/lib/image-cache";

await clearCache();
```

---

## Cache Keys

How similar content gets cached together:

```typescript
// Cache key = SHA256(title + summary + site)

// These have the SAME cache key (hit):
getCachedImage("AI in Healthcare", "...", "Tech Daily")
getCachedImage("AI in Healthcare", "...", "Tech Daily")
                                   ↓
                            Cache HIT ✅

// These have DIFFERENT cache keys (miss):
getCachedImage("AI in Finance", "...", "Tech Daily")
                             ↑
                      Different title = Different key
                                   ↓
                            Cache MISS, API call
```

---

## Real-World Example

```
Monday: Upload "AI Healthcare Report.pdf"
  → Title: "AI in Healthcare"
  → Site: "Tech Weekly"
  → Cache MISS → API call ($0.08)
  → Result cached ✅

Wednesday: Upload "Healthcare AI Analysis.pdf"
  → Title: "Healthcare and Artificial Intelligence"
  → Site: "Tech Weekly"
  → Cache MISS → API call ($0.08) [Different title]

Friday: Upload another "AI Healthcare..." PDF
  → Title: "AI in Healthcare" (similar topic)
  → Site: "Tech Weekly"
  → Cache HIT ✅ (returns Monday's cover)
  → Cost: $0 ✅

Weekly cost: $0.16 (vs $0.24 without cache)
Savings: $0.08 (33% reduction)
```

---

## Troubleshooting

### Cache not working?

```bash
# Check if enabled
echo $IMAGE_CACHE_ENABLED
# Should be empty (defaults to true) or "true"

# Check cache directory
ls -la .data/cache/images/
# Should have .json files

# Check logs
grep "\[Image Cache\]" app.log
# Should see HIT/MISS messages
```

### Cache files not being created?

```bash
# Check permissions
chmod -R 755 .data/cache/

# Check disk space
df -h .data/
# Need at least 100 MB free
```

### Hit rate too low?

**Possible causes:**
- Content is very unique (each paper different)
- Summary text varies slightly
- Different site names

**Fix:** Normalize content before caching (if needed)

---

## Cost Calculator

Use this to estimate savings:

```
Papers/month: 100
Hit rate estimate: 40%
API cost per image: $0.08

Without cache: 100 × $0.08 = $8.00
With cache: 60 × $0.08 = $4.80
Savings: $3.20/month (40%)

Annual savings: $38.40
```

---

## Files

- **[lib/image-cache.ts](lib/image-cache.ts)** - Cache implementation
- **[lib/ai-drafts.ts](lib/ai-drafts.ts)** - Integration point
- **[IMAGE_CACHING_GUIDE.md](IMAGE_CACHING_GUIDE.md)** - Complete guide

---

## Next Steps

1. ✅ Caching is already working (enabled by default)
2. Monitor hit ratio: `grep "[Image Cache]" logs`
3. (Optional) Review [IMAGE_CACHING_GUIDE.md](IMAGE_CACHING_GUIDE.md) for advanced features

---

## Summary

| Feature | Status |
|---------|--------|
| **Enabled by default?** | ✅ Yes |
| **Configuration needed?** | ❌ No |
| **Works automatically?** | ✅ Yes |
| **Saves money?** | ✅ Yes (20-50% typical) |
| **Improves speed?** | ✅ Yes (30-60s → 1-50ms for hits) |
| **Requires setup?** | ❌ No |

**You're done! Caching works out of the box.** ✅

