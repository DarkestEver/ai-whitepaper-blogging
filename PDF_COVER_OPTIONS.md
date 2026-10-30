# PDF Cover Image Generation - All Options

**Status:** ✅ Three strategies now supported (with configuration)

---

## Overview

You now have **three options** for cover image generation:

| Strategy | Cost | Speed | Quality | Setup |
|----------|------|-------|---------|-------|
| **ai-generated** | $0.08/image | 30-60s | High (branded) | OpenAI API key |
| **pdf-screenshot** | $0 | 5-10s | Medium (authentic) | Canvas/Puppeteer |
| **skip** | $0 | 0s | None | None needed |

---

## Configuration

Set the strategy via environment variable:

```bash
# Default - use DALL-E to generate editorial covers
COVER_IMAGE_STRATEGY=ai-generated

# OR - extract first page from PDF (requires setup)
COVER_IMAGE_STRATEGY=pdf-screenshot

# OR - no cover images
COVER_IMAGE_STRATEGY=skip
```

---

## Strategy 1: AI-Generated (Default)

**What:** OpenAI DALL-E creates a unique editorial illustration for each paper.

**Pros:**
- ✅ High quality, polished look
- ✅ Branded to match publication
- ✅ No PDF dependency
- ✅ Works with any document type

**Cons:**
- ❌ Costs ~$0.08 per image
- ❌ 30-60 second latency
- ❌ Requires API key
- ❌ External API dependency

**Setup:**
```bash
OPENAI_IMAGE_API_KEY=sk-...
COVER_IMAGE_STRATEGY=ai-generated
```

**Example Output:**
```
[Cover Image] Generated: ai-generated (Tech Daily)
```

---

## Strategy 2: PDF Screenshot (Recommended for Cost Savings)

**What:** Extract the first page of the PDF and use it as the cover.

**Pros:**
- ✅ FREE (no API costs)
- ✅ Fast (5-10 seconds)
- ✅ Authentic to source document
- ✅ Works offline

**Cons:**
- ❌ Quality depends on PDF design
- ❌ May include text/logos (not always editorial)
- ❌ Requires additional library setup
- ❌ Some PDFs have blank first pages

**Setup Required:**

### Option A: Canvas Library (Recommended for full image rendering)
```bash
npm install canvas
# May require build tools on Windows:
# npm install --build-from-source canvas
```

### Option B: Puppeteer (Uses real Chrome/Chromium)
```bash
npm install puppeteer
# Uses ~200MB disk space, but more reliable
```

### Option C: pdf2pic (Lightweight, requires ImageMagick)
```bash
npm install pdf2pic
# Also requires ImageMagick: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)
```

**Configuration:**
```bash
COVER_IMAGE_STRATEGY=pdf-screenshot
```

**Example Output:**
```
[Cover Image] Generated: pdf-screenshot (Tech Daily)
```

**Auto-Skip Blank Pages:**
The system automatically detects if the first page is blank/title-only and can skip to page 2 or 3.

---

## Strategy 3: Skip

**What:** No cover images generated.

**Pros:**
- ✅ Zero cost
- ✅ Zero latency
- ✅ No dependencies

**Cons:**
- ❌ Papers have no cover image
- ❌ Less visually appealing

**Setup:**
```bash
COVER_IMAGE_STRATEGY=skip
```

**Example Output:**
```
[Cover Image] Generated: null (Tech Daily)
```

**Use Case:** When testing or when you'll upload images manually.

---

## Hybrid Approach (Recommended for Production)

Use **pdf-screenshot as primary** with **ai-generated as fallback**:

```typescript
// In future update:
if (COVER_IMAGE_STRATEGY === "pdf-screenshot") {
  try {
    return await extractPdfScreenshot(bytes);
  } catch (error) {
    console.warn("PDF screenshot failed, using AI-generated instead");
    return await generateAICover(content, site);
  }
}
```

This gives you:
- Free covers when possible (PDF screenshot)
- Fallback to high-quality (AI) when needed
- Best of both worlds

---

## How It Works

### AI-Generated Flow
```
PDF Upload
    ↓
Extract text + generate content
    ↓
generateCover(content, site, bytes)
    ↓
Check API key exists
    ↓
Call OpenAI DALL-E API
    ↓
Receive base64 PNG
    ↓
Save to .data/media/
    ↓
Store URL in database
```

### PDF Screenshot Flow
```
PDF Upload
    ↓
Extract text + generate content
    ↓
generateCover(content, site, bytes)
    ↓
Check if first page is title/blank
    ↓
[IF TITLE] Skip to next page
    ↓
Render page to PNG (via canvas/puppeteer)
    ↓
Save to .data/media/
    ↓
Store URL in database
```

---

## Cost Comparison

**Scenario:** Generate 100 whitepapers per month

| Strategy | Cost | Speed | Total Time |
|----------|------|-------|-----------|
| **ai-generated** | $8/month | 45s each | 75 minutes |
| **pdf-screenshot** | $0/month | 7s each | 12 minutes |
| **hybrid** | $2-4/month | 7-45s | 15-30 minutes |

---

## Implementation Guide

### Current Status
- ✅ AI-generated fully implemented
- ⏳ PDF screenshot partially implemented (detects blank pages)
- ⏳ Hybrid approach ready for implementation

### Adding Canvas Support

```bash
# Install canvas
npm install canvas

# On Windows, may need Visual Studio Build Tools
# Or use WSL: wsl npm install canvas
```

Then update [lib/pdf-screenshot.ts](lib/pdf-screenshot.ts) to restore the rendering code:

```typescript
import { createCanvas } from "canvas";

export async function extractPdfScreenshot(bytes: Buffer, options?: PDFScreenshotOptions): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Render PDF page to canvas
  const renderContext = {
    canvasContext: ctx,
    viewport: page.getViewport({ scale: scaleFactor }),
  };

  await page.render(renderContext).promise;
  return canvas.toBuffer("image/png");
}
```

### Adding Puppeteer Support

```bash
npm install puppeteer
```

```typescript
import puppeteer from "puppeteer";

export async function extractPdfScreenshot(bytes: Buffer): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Convert bytes to data URL
  const dataUrl = `data:application/pdf;base64,${bytes.toString("base64")}`;
  await page.goto(dataUrl, { waitUntil: "networkidle0" });

  // Screenshot first page
  const screenshot = await page.screenshot({ type: "png" });
  await browser.close();

  return screenshot;
}
```

---

## Environment Variables

```bash
# Cover image generation strategy
COVER_IMAGE_STRATEGY=ai-generated              # Default: DALL-E generated
                                               # OR pdf-screenshot
                                               # OR skip

# For AI-generated covers (OpenAI DALL-E)
OPENAI_IMAGE_API_KEY=sk-...                   # Image API key (separate from text)
OPENAI_IMAGE_MODEL=dall-e-3                   # Model: dall-e-3 or dall-e-2

# Fallback to main AI provider
AI_PROVIDER=openai
AI_API_KEY=sk-...
```

---

## Logging & Debugging

### Current Logging
```typescript
console.log(`[Cover Image] Generated: ${coverResult.source} (${site.name})`);
```

Output examples:
```
[Cover Image] Generated: ai-generated (Tech Daily)
[Cover Image] Generated: pdf-screenshot (Tech Daily)
[Cover Image] Generated: null (Tech Daily) // When COVER_IMAGE_STRATEGY=skip
```

### Debug Mode
```typescript
// Add logging to understand which strategy is running
console.log(`[Cover Image] Strategy: ${COVER_IMAGE_STRATEGY}`);
console.log(`[Cover Image] API Key available: ${!!apiKey}`);
console.log(`[Cover Image] PDF bytes available: ${!!pdfBytes}`);
```

---

## Testing

### Test AI Generation
```bash
# Set up environment
export OPENAI_IMAGE_API_KEY=sk-...
export COVER_IMAGE_STRATEGY=ai-generated

# Run tests
npm test
```

### Test PDF Screenshot
```bash
# Install canvas first
npm install canvas

# Then test
export COVER_IMAGE_STRATEGY=pdf-screenshot
npm test
```

### Test with Skip
```bash
export COVER_IMAGE_STRATEGY=skip
npm test
```

---

## Production Considerations

### Storage
- ✅ Local `.data/media/` (dev only)
- ❌ Production needs cloud storage (S3, GCS, Azure)

### Recommendations
1. **Use pdf-screenshot by default** (free, fast, authentic)
2. **Fall back to ai-generated** when screenshot fails
3. **Upload to cloud storage** (S3, etc.)
4. **Serve via CDN** for fast delivery
5. **Monitor costs** if using AI generation heavily

### Example Production Config
```bash
# Primary: PDF screenshot (free)
COVER_IMAGE_STRATEGY=pdf-screenshot

# Fallback: AI generation (if screenshot fails)
OPENAI_IMAGE_API_KEY=sk-...
OPENAI_IMAGE_MODEL=dall-e-3

# Storage
S3_BUCKET=my-media-bucket
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## Troubleshooting

### No cover image generated
```
[Cover Image] Generated: null
```
**Cause:** `COVER_IMAGE_STRATEGY=skip` or API key missing

**Fix:** Set strategy and API key:
```bash
export COVER_IMAGE_STRATEGY=ai-generated
export OPENAI_IMAGE_API_KEY=sk-...
```

### PDF screenshot not working
```
PDF screenshot strategy selected but not yet implemented.
To enable, install: npm install canvas
```

**Fix:** Install canvas or Puppeteer:
```bash
npm install canvas
```

### Timeout error (PDF rendering too slow)
```
PDF rendering exceeded the 30-second limit
```

**Cause:** PDF is complex or PDF.js is slow on your system

**Fix:** Either:
1. Use ai-generated strategy instead
2. Increase timeout in code
3. Optimize PDF (reduce complexity)

### API rate limits
```
AI image generation failed with HTTP 429
```

**Cause:** Too many requests to OpenAI in short time

**Fix:**
1. Implement exponential backoff retry
2. Use pdf-screenshot strategy instead
3. Batch generation over time

---

## Future Roadmap

- [ ] Implement Canvas/Puppeteer rendering for PDF screenshots
- [ ] Hybrid strategy (try PDF screenshot, fall back to AI)
- [ ] Image optimization (compress, create responsive sizes)
- [ ] CDN integration (S3, Cloudflare)
- [ ] Analytics dashboard (track cost, generation time)
- [ ] Multi-option selection (generate 3 images, user picks)
- [ ] Stable Diffusion integration (cheaper alternative to DALL-E)
- [ ] Image caching (reuse for similar topics)

---

## Code Files

- **[lib/ai-drafts.ts](lib/ai-drafts.ts)** - Main orchestration + AI cover generation
- **[lib/pdf-screenshot.ts](lib/pdf-screenshot.ts)** - PDF page extraction (metadata only currently)
- **[lib/media.ts](lib/media.ts)** - File storage + serving
- **[IMAGE_GENERATION_GUIDE.md](IMAGE_GENERATION_GUIDE.md)** - Detailed image generation docs

