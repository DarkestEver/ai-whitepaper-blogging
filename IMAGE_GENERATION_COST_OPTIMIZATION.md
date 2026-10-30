# Image Generation Cost Optimization - Scale Strategy

**Challenge:** 3000 PDFs × 30 sites = 90,000 potential covers
**Cost without optimization:** $7,200
**Target:** Reduce to <$200 (97% savings)

---

## Strategy Overview

### Phase 1: Reduce Images Needed (No API Calls)
- Only generate for published papers (~10% of total)
- Skip drafts (use templates)
- Skip archived papers
- **Impact: -70% of covers needed**

### Phase 2: Reuse Covers (Better Caching)
- Fuzzy matching: Similar titles = same cover
- Cross-site sharing: Same PDF on multiple sites = same cover
- Content clustering: Group by topic
- **Impact: -80% of API calls**

### Phase 3: Cheaper Generation (Swap Models)
- DALL-E 2 instead of DALL-E 3 (75% cheaper)
- Stable Diffusion (90% cheaper)
- PDF screenshots (100% free)
- **Impact: -90% of costs**

### Phase 4: Smart Batching (Better Queue)
- Rate limiting (avoid throttling)
- Off-peak generation (cheaper APIs)
- Progressive generation
- **Impact: Faster, safer execution**

---

## Cost Breakdown & Targets

```
Current state (worst case):
90,000 papers × 30 sites × $0.08 (DALL-E 3) = $216,000 ❌

Optimization Phase 1 (published only):
9,000 papers × 30 sites × $0.08 = $21,600 (10x reduction)

Optimization Phase 2 (with fuzzy caching):
9,000 papers × 30 sites × $0.08 × 20% hit rate = $4,320

Optimization Phase 3 (DALL-E 2):
9,000 papers × 30 sites × $0.02 × 20% hit rate = $1,080

Optimization Phase 4 (Hybrid: 60% PDF, 40% DALL-E 2):
- 60% PDF screenshots: FREE
- 40% DALL-E 2: 9,000 × $0.02 × 20% = $360

FINAL COST: ~$360/month (97% savings) ✅
```

---

## Detailed Optimization Strategies

### STRATEGY 1: Only Generate for Published Papers

**Status:** Published papers only (not drafts)

```typescript
// Add to Whitepaper model before generating
if (whitepaper.status !== "published") {
  // Use template cover instead
  coverImageUrl = getTemplateCover(whitepaper);
  // Or leave empty
  coverImageUrl = "";
  return;
}

// Only published papers get generated covers
const coverResult = await generateCover(content, site, bytes);
```

**Impact:**
- Most papers are drafts (80-90%)
- Only publish ~10% → Generate 9x fewer covers
- **Cost reduction: 90%** ✅

**Implementation:**
```typescript
// In generateDraftsForSource()
if (COVER_IMAGE_STRATEGY !== "skip") {
  // Generate but mark as draft
  const coverResult = await generateCover(content, site, bytes);
  // Will regenerate when published (with cache hit)
}
```

---

### STRATEGY 2: Fuzzy Caching & Content Clustering

**Reuse covers for similar content**

```typescript
// Instead of exact title match, use semantic similarity
// "AI in Healthcare" = "Healthcare AI" = "Artificial Intelligence + Medicine"

import { getSemanticCacheKey } from "@/lib/image-cache";

// Cluster similar papers
const clusters = {
  "AI/ML": ["AI in healthcare", "machine learning medicine", "AI diagnosis"],
  "Climate": ["climate change", "global warming", "carbon emissions"],
  "Finance": ["stocks", "bonds", "crypto", "trading"],
};

// Generate ONE cover per cluster, reuse for all
async function generateClusteredCovers() {
  for (const [cluster, topics] of Object.entries(clusters)) {
    const cover = await generateCover(cluster, site, bytes);
    // Reuse for all topics in cluster
    for (const topic of topics) {
      await cacheImage(topic, "summary", site, cover, "ai-generated");
    }
  }
}
```

**Impact:**
- 50+ topics clustered into 5-10 categories
- Generate 1 cover per category per site
- **Cost reduction: 80-90%** ✅

**Better approach: Semantic hashing**
```typescript
function getSemanticCacheKey(title: string, site: string): string {
  // Instead of exact match, use semantic similarity
  // "AI in healthcare" and "healthcare AI" → same key

  // Extract main keywords
  const keywords = extractKeywords(title).sort(); // Normalize order
  return SHA256(keywords.join("|") + site);
}

// Results:
// "AI in healthcare" → "ai|healthcare"
// "healthcare AI" → "ai|healthcare" ← SAME KEY!
// "Machine learning medicine" → "learning|machine|medicine"
```

---

### STRATEGY 3: Swap to Cheaper Models

**Use DALL-E 2 or Stable Diffusion instead of DALL-E 3**

**Pricing comparison:**
```
DALL-E 3: $0.08 per image (high quality, editorial)
DALL-E 2: $0.02 per image (75% cheaper)
Stable Diffusion API: $0.003 per image (96% cheaper)
Locally hosted Stable Diffusion: FREE
```

**Implementation:**

```typescript
// .env
OPENAI_IMAGE_MODEL=dall-e-2    # Change from dall-e-3

// Cost reduction: 75% ✅
```

**If willing to use Stable Diffusion:**

```typescript
// lib/image-generators/stable-diffusion.ts
async function generateWithStableDiffusion(
  prompt: string
): Promise<Buffer> {
  const response = await fetch("https://api.stability.ai/v1/generate", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      steps: 30,
      cfg_scale: 7,
      width: 1024,
      height: 1024,
    }),
  });

  const data = await response.json();
  return Buffer.from(data.artifacts[0].base64, "base64");
}

// Cost reduction: 96% ✅
```

---

### STRATEGY 4: Hybrid Approach (PDF + AI)

**Use PDF screenshots when possible, AI only as fallback**

```typescript
export const COVER_IMAGE_STRATEGY = "hybrid-optimized";

// Priority order:
// 1. Check cache (FREE if hit)
// 2. Try PDF screenshot (FREE, quality depends on PDF)
// 3. Try DALL-E 2 (CHEAP, $0.02)
// 4. Return template (FREE, generic)

async function generateCoverOptimized(
  content: GeneratedContent,
  site: SiteRecord,
  pdfBytes?: Buffer,
): Promise<{ url: string; source: string }> {
  // 1. Cache check
  const cached = await getCachedImage(content.title, content.summary, site.name);
  if (cached) return { url: cached.url, source: "cache" };

  // 2. PDF screenshot (free)
  if (pdfBytes) {
    const pdf = await extractPdfScreenshot(pdfBytes);
    if (pdf) {
      await cacheImage(...);
      return { url: pdf, source: "pdf-screenshot" };
    }
  }

  // 3. DALL-E 2 (cheap, $0.02)
  const ai = await generateAICover(content, site, "dall-e-2");
  if (ai) {
    await cacheImage(...);
    return { url: ai, source: "ai-generated" };
  }

  // 4. Template (free)
  return { url: getTemplateUrl(site.accentColor), source: "template" };
}

// Cost breakdown for 9000 papers:
// - 40% PDF screenshots: FREE
// - 30% Cache hits: FREE
// - 20% AI (DALL-E 2): 1800 × $0.02 = $36
// - 10% Templates: FREE
// Total: $36/month ✅
```

---

### STRATEGY 5: Background Job Queue

**Don't generate upfront, generate on-demand/background**

```typescript
// lib/image-generation-queue.ts
import Bull from "bull"; // npm install bull

const imageQueue = new Bull("image-generation", {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

// Queue a paper for cover generation
async function queueCoverGeneration(paperId: string, priority: number) {
  await imageQueue.add(
    { paperId },
    {
      priority, // 1=published, 2=in-review, 3=draft
      delay: priority * 3600000, // Stagger by priority
    }
  );
}

// Process queue with rate limiting
imageQueue.process(5, async (job) => {
  const paper = await getPaper(job.data.paperId);

  // Rate limit: 1 request per second to avoid throttling
  await sleep(1000);

  const cover = await generateCover(paper.content, paper.site, paper.bytes);
  await updatePaper(paper.id, { coverImageUrl: cover.url });
});

// Results:
// - Generate 1 image/sec = 86,400/day
// - 9,000 papers = 2.6 hours to complete
// - Spread over off-peak hours
// - Avoid API throttling ✅
```

**Configuration:**
```typescript
// Priority: Published > In-Review > Draft
const GENERATION_PRIORITY = {
  published: 1,      // Generate first (1 sec after publish)
  in_review: 2,      // Wait 1 hour
  draft: 3,          // Wait 3 hours (or skip)
};

// Rate limiting
const API_RATE_LIMIT = {
  openai: 100,       // 100 requests/min safe
  stability: 200,    // Stability allows more
};

// Implementation:
await imageQueue.add(
  { paperId },
  {
    priority: GENERATION_PRIORITY[paper.status],
    delay: paper.status === "draft" ? SKIP_GENERATION : 0,
  }
);
```

---

### STRATEGY 6: Smart Batch Generation

**Generate multiple covers in single batch**

```typescript
// Generate 10 similar papers with 1 prompt optimization
async function batchGenerateCovers(
  papers: IWhitepaper[],
  site: SiteRecord
) {
  // Group by topic
  const groups = groupByTopic(papers);

  for (const [topic, paperGroup] of Object.entries(groups)) {
    // Generate ONE cover for topic
    const cover = await generateCover(
      {
        title: topic,
        summary: topic,
        // ... other fields
      },
      site,
      null
    );

    // Reuse for all papers in group
    for (const paper of paperGroup) {
      await updatePaper(paper.id, { coverImageUrl: cover.url });
    }
  }
}

// Cost reduction: 80-90% ✅
```

---

### STRATEGY 7: Template Covers (No API)

**For drafts and unpublished papers, use branded templates**

```typescript
// lib/template-covers.ts
export function getTemplateUrl(
  site: ISite,
  topic?: string
): string {
  // Generate SVG template dynamically
  const svg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <!-- Gradient background -->
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${site.brandColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${site.accentColor};stop-opacity:1" />
        </linearGradient>
      </defs>

      <rect width="1024" height="1024" fill="url(#grad)"/>

      <!-- Logo -->
      <text x="512" y="512" text-anchor="middle" font-size="64" fill="white">
        ${site.name}
      </text>

      <!-- Topic (if provided) -->
      ${topic ? `<text x="512" y="600" text-anchor="middle" font-size="32" fill="white">${topic}</text>` : ""}
    </svg>
  `;

  // Convert SVG to PNG and cache
  const png = await svgToPng(svg);
  return await saveCoverImage(new File([png], "template.png"));
}

// Usage
if (paper.status === "draft" || !apiKeyAvailable) {
  paper.coverImageUrl = getTemplateUrl(site, paper.category);
  // Cost: FREE ✅
  // Time: <100ms ✅
}
```

---

### STRATEGY 8: AI Cover Variants

**Generate ONE cover, use variations**

```typescript
// Instead of:
// Paper 1 "AI in Healthcare" → Generate ($0.08)
// Paper 2 "AI in Finance" → Generate ($0.08)
// Paper 3 "AI in Law" → Generate ($0.08)

// Do this:
// Generate 1 "AI/Machine Learning" cover with variations
const basePrompt = "Abstract illustration of AI and technology";
const variations = [
  `${basePrompt} in healthcare context`,
  `${basePrompt} in finance context`,
  `${basePrompt} in legal context`,
];

// Use DALL-E batch mode (if available)
const covers = await batchGenerateImages(variations);

// Reuse for similar papers
for (const paper of aiPapers) {
  paper.coverImageUrl = selectBestVariation(paper.topic, covers);
}

// Cost: 1 API call instead of 100 ✅
```

---

## Implementation Roadmap

### Phase 1 (Week 1): Quick Wins
- [ ] Only generate for published papers
- [ ] Implement fuzzy caching
- [ ] Switch to DALL-E 2
- **Cost reduction: 75-80%**

### Phase 2 (Week 2-3): Smart Generation
- [ ] PDF screenshots as primary
- [ ] Background job queue
- [ ] Template covers for drafts
- **Cost reduction: 95%**

### Phase 3 (Week 4+): Long-term
- [ ] Stable Diffusion integration
- [ ] Content clustering
- [ ] AI cover variants
- [ ] Self-hosted image generation
- **Cost reduction: 98%+**

---

## Final Recommendation

### Implement immediately:
```bash
# 1. Only generate published papers
# 2. Use DALL-E 2 ($0.02 vs $0.08)
# 3. Aggressive caching (40%+ hit rate)
# 4. PDF screenshots + template fallback

Cost breakdown (9,000 published papers):
- 30% PDF screenshots: $0
- 30% Cache hits: $0
- 40% DALL-E 2: 3,600 × $0.02 = $72/month

TOTAL: ~$72/month ✅ (vs $7,200 without optimization)
Savings: 99% ✅
```

### Optional (Phase 2):
```bash
# Implement background queue
# Add template covers
# Switch to Stable Diffusion for non-critical

Cost breakdown:
- 40% PDF screenshots: $0
- 40% Cache hits: $0
- 10% Stable Diffusion: 900 × $0.003 = $2.70
- 10% Templates: $0

TOTAL: ~$3/month ✅
Savings: 99.9% ✅
```

---

## Code Examples

### Quick Setup (Phase 1)

```typescript
// Only generate for published
if (whitepaper.status !== "published") {
  whitepaper.coverImageUrl = ""; // Or template
  return;
}

// Use DALL-E 2
process.env.OPENAI_IMAGE_MODEL = "dall-e-2";

// Fuzzy caching enabled (already integrated)
const cached = await getCachedImage(title, summary, site);
if (cached) return cached;

// Generate with rate limiting
await sleep(1000); // 1 request/sec
const cover = await generateAICover(content, site);
```

### Full Optimization (Phase 2)

```typescript
// 1. PDF screenshot
const pdfCover = await extractPdfScreenshot(bytes);
if (pdfCover) return { url: pdfCover, source: "pdf" };

// 2. Cache
const cached = await getCachedImage(title, summary, site);
if (cached) return cached;

// 3. DALL-E 2 (cheap)
const aiCover = await generateAICover(content, site, "dall-e-2");
if (aiCover) return { url: aiCover, source: "ai" };

// 4. Template
return { url: getTemplateUrl(site), source: "template" };
```

---

## Monitoring

### Track cost reduction
```bash
# Count API calls by type
SELECT COUNT(*), source
FROM whitepaper_covers
GROUP BY source;

# Expected result:
# pdf-screenshot: 3600 (40%)
# cache-hit: 3600 (40%)
# ai-generated: 1800 (20%)
```

### Measure impact
```
Before: $7,200/month
After: $72-300/month
Savings: 97-99% ✅
```

---

## Summary

| Strategy | Cost Reduction | Effort | Recommended |
|----------|---|---|---|
| Published only | 90% | Low | ✅ YES |
| Fuzzy caching | 80% | Medium | ✅ YES |
| DALL-E 2 | 75% | Low | ✅ YES |
| PDF screenshots | 100% | Medium | ✅ YES |
| Job queue | 20% | High | ⏸️ Nice-to-have |
| Templates | 100% | Low | ✅ YES |
| Stable Diffusion | 96% | Medium | ⏸️ Phase 2 |

**Combined impact: 97-99% cost reduction** 🎉

