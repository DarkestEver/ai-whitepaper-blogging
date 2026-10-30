# Image Generation for Pages - Implementation Guide

## Overview

Images are **automatically generated using OpenAI's DALL-E API** when AI drafts are created from PDF sources. Each whitepaper/research entry gets a unique, editorial cover illustration.

---

## How It Works

### 1. **Trigger Point**

When `generateDraftsForSource()` is called in [lib/ai-drafts.ts](lib/ai-drafts.ts:198):

```typescript
const coverImageUrl = await generateCover(content, site);
```

This happens **after** the AI has generated the content (title, summary, etc.) but **before** the whitepaper is saved to the database.

### 2. **Image Generation Pipeline**

```
PDF Upload
    ↓
Extract text + metadata
    ↓
Call AI to generate content
    ↓
generateCover(content, site)  ← Image generation happens here
    ↓
Call OpenAI DALL-E API
    ↓
Receive base64-encoded image
    ↓
Save to .data/media/ directory
    ↓
Store URL in whitepaper.coverImageUrl
    ↓
Use in templates + SEO
```

### 3. **The generateCover() Function**

Located in [lib/ai-drafts.ts:112-145](lib/ai-drafts.ts:112)

```typescript
async function generateCover(content: GeneratedContent, site: SiteRecord): Promise<string>
```

**What it does:**
1. Checks for OpenAI API key
2. Creates a detailed prompt based on:
   - The whitepaper title
   - The site name + domain
   - The site's editorial description
3. Calls OpenAI DALL-E `/images/generations` endpoint
4. Decodes base64 PNG response
5. Saves image to local filesystem
6. Returns public URL for serving

**Key characteristics:**
- ✅ **30-second timeout** for API calls
- ✅ **1024x1024 PNG** format (editorial size)
- ✅ **Single generation** (n=1) per paper
- ✅ **Graceful fallback**: Returns empty string if API unavailable

### 4. **The Prompt Template**

```typescript
prompt: `Create an original, polished editorial cover illustration for
a research publication about "${content.title}".

The visual mood should suit ${site.name} (${domain}),
a publication described as: ${site.description}.

Use abstract editorial shapes, tasteful color, and no text, letters,
logos, charts, or depictions of real people.

Do not infer facts from the domain or imply unsupported facts or
depict a specific event.`
```

**Design principles:**
- 🎨 **Abstract editorial style** (not photorealistic)
- 🚫 **No text/logos** (avoids readability issues)
- 🚫 **No real people** (avoids copyright/ethical issues)
- 🌐 **Site-aware** (tailored to publication brand)
- 📚 **Fact-grounded** (doesn't invent facts)

---

## Configuration

### Required Environment Variables

```bash
# For OpenAI image generation
OPENAI_IMAGE_API_KEY=sk-...        # Separate API key for images (recommended)
OPENAI_IMAGE_MODEL=dall-e-3        # Or: dall-e-2 (default: "gpt-image-1")

# OR fallback to main AI provider key
AI_PROVIDER=openai
AI_API_KEY=sk-...
```

### Optional Settings

- `OPENAI_IMAGE_MODEL` - Default: `gpt-image-1` (falls back to `dall-e-3` or `dall-e-2`)
- AI image timeout - 60 seconds (hardcoded constant `AI_TIMEOUT_MS`)

---

## Storage & Serving

### File Storage

Images are stored in **local development** at:
```
.data/media/{uuid}.{jpg|png|webp}
```

File structure in [lib/media.ts:1-123](lib/media.ts):
- Location: `.data/media/` directory
- Naming: UUID v4 + extension (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890.png`)
- Permissions: Read/write restricted (mode 0o600)
- Max size: **5 MB per image**

### Image Identification

[lib/media.ts:12-35](lib/media.ts) validates images by magic bytes:
- **JPEG**: `FF D8 FF` signature
- **PNG**: `89 50 4E 47 0D 0A 1A 0A` signature
- **WebP**: `RIFF ... WEBP` signature

### Public URL

Generated images are served via:
```
/api/media/{uuid}.png
```

Example:
```
/api/media/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png
```

---

## Database Storage

Images are linked in the **Whitepaper model** ([lib/models.ts:113-160](lib/models.ts)):

```typescript
interface IWhitepaper {
  coverImageUrl: string;        // "/api/media/uuid.png"
  coverImageAlt: string;        // Alt text for accessibility
  // ... other fields
}
```

Alt text is auto-generated:
```typescript
coverImageAlt: `AI-generated editorial illustration for ${content.title}`.slice(0, 180)
```

---

## Cost & Usage

### Pricing

**OpenAI DALL-E 3:**
- ~$0.08 per image (1024x1024)
- Higher quality, better for editorial use

**DALL-E 2:**
- ~$0.016 per image (1024x1024)
- Faster, lower cost

### Logging

Each generated image is logged:
```
[AI Generation] Site Name: evaluation_score/100, ~tokens tokens, ~$cost
```

Example:
```
[AI Generation] Tech Daily: 82/100, ~3450 tokens, ~$0.0520
```

---

## Error Handling

### If API Key is Missing
```typescript
if (!apiKey) return "";  // Silent fallback - no image
```
- Paper is created **without** a cover image
- No error thrown (graceful degradation)
- Can be added manually later

### If API Call Fails
```typescript
if (!response.ok) {
  console.error("AI image provider request failed.", { status });
  throw new Error(`AI image generation failed with HTTP ${status}.`);
}
```

Generated papers are **rolled back** (deleted) if image generation fails, ensuring data consistency.

### If Timeout Occurs
- AbortController cancels request after 60 seconds
- Error is caught and propagates up
- Paper creation is rolled back

---

## Current Limitations

### Development Only
```typescript
if (process.env.NODE_ENV === "production") {
  throw new FeatureUnavailableError(
    "Local image uploads are disabled in production until
    approved object storage is configured."
  );
}
```

**In production, you need:**
- ✅ Cloud storage (S3, Google Cloud Storage, Azure Blob, etc.)
- ✅ CDN for fast delivery
- ✅ Cost controls/quotas
- ✅ Analytics/monitoring

### No Caching
- Each paper gets a unique image
- No image reuse across papers
- High API usage for large batches

### Single Generation
- Only 1 image per paper (`n=1`)
- No choice/variations
- Can't regenerate without deleting

---

## Improvements & Extensions

### 1. **Custom Image Styles per Site**
```typescript
// Extend site schema with branding
site.imageStyle = "minimalist" | "gradient" | "abstract" | "photo"
site.imageBrandColor = "#FF6B6B"

// Pass to prompt
prompt: `... Use a ${site.imageStyle} style with brand color ${site.imageBrandColor}...`
```

### 2. **Image Variations**
```typescript
// Generate multiple options (DALL-E supports n=4)
const options = await generateCoverVariations(content, site, count: 4);
// User selects preferred image
```

### 3. **Local Image Processing** (No API call)
```typescript
// Use Stable Diffusion / RunwayML API (cheaper)
// Or Canvas/Node-canvas for generative art
// Or Midjourney for higher quality

// lib/image-generator-stable.ts
async function generateWithStableDiffusion(prompt: string) {
  // Call Stable Diffusion API
}
```

### 4. **Image Optimization**
```typescript
// Add lib/image-optimizer.ts
async function optimizeImage(pngBuffer: Buffer) {
  // Compress with sharp/imagemin
  // Generate WebP version
  // Create responsive sizes (mobile/tablet/desktop)
}
```

### 5. **CDN Integration** (Production)
```typescript
// lib/cdn-uploader.ts
async function uploadToCDN(imageBytes: Buffer, filename: string) {
  // Upload to S3 / GCS / Azure
  return `https://cdn.example.com/media/${filename}`
}
```

### 6. **Analytics & Monitoring**
```typescript
// Track image generation
console.log({
  event: "image_generated",
  paper_id: paper.id,
  site: site.name,
  api_provider: "openai",
  model: "dall-e-3",
  cost: 0.08,
  generation_time_ms: 2500,
  success: true
});
```

### 7. **Manual Image Upload**
Already supported! In addition to auto-generation:
```typescript
// Users can upload custom cover images via admin UI
// Stored in same .data/media/ location
// Used if provided, otherwise AI-generated image used
```

---

## Testing Image Generation

### Manual Test
```typescript
import { generateDraftsForSource } from "@/lib/ai-drafts";

// Set environment variables first
process.env.OPENAI_IMAGE_API_KEY = "sk-...";
process.env.AI_PROVIDER = "openai";

// Upload PDF + generate
const papers = await generateDraftsForSource(sourceDoc, [site]);
papers.forEach(p => {
  console.log("Image URL:", p.coverImageUrl);
  console.log("Image Alt:", p.coverImageAlt);
});
```

### Check Generated Images
```bash
# List all generated images
ls -lah .data/media/

# Serve locally
open http://localhost:3000/api/media/uuid.png
```

### Verify Image Quality
- Open in browser
- Check dimensions (should be 1024x1024)
- Verify no text/people/charts
- Confirm editorial style

---

## Security Considerations

### API Key Protection
- ✅ Never log API keys
- ✅ Use separate `OPENAI_IMAGE_API_KEY` from text API
- ✅ Rate limit image generation per site
- ✅ Monitor for unusual activity

### File Validation
- ✅ Check magic bytes (not just extension)
- ✅ Reject files > 5 MB
- ✅ Scan for malicious content (future: ClamAV)
- ✅ Restricted file permissions (0o600)

### Prompt Injection
- ✅ Prompt template **does not accept user input directly**
- ✅ Uses only AI-generated title + site description
- ✅ Constraints prevent harmful content ("no real people", "no facts")

### Availability
- ✅ Timeout prevents hanging (60s max)
- ✅ Graceful fallback if API down (no image = paper still created)
- ✅ Error handling + retry logic on network failures

---

## Future AI Models

### Anthropic Claude (Vision)
Currently Claude can view images but **cannot generate** them. Future update could:
```typescript
// Use Claude to describe image, then DALL-E to generate
const imageDescription = await claude.vision.describe(pdfContent);
const image = await dallE.generate(imageDescription);
```

### Google Vertex AI
```typescript
const response = await vertexAI.imageGeneration.generate({
  prompt: generatedPrompt,
  model: "imagegeneration@006"
});
```

### Open Source (Stable Diffusion)
```typescript
// Host locally or use API
const result = await stableDiffusionAPI.generate({
  prompt: generatedPrompt,
  steps: 50,
  guidance_scale: 7.5
});
```

---

## Monitoring & Logging

### Current Logging
```
[AI Generation] Site Name: score/100, ~tokens tokens, ~$cost
```

### Recommended Enhanced Logging
```typescript
console.log({
  timestamp: new Date().toISOString(),
  event: "cover_image_generated",
  paper_id: paper.numericId,
  site_id: site.numericId,
  api_provider: "openai",
  model: "dall-e-3",
  prompt_length: prompt.length,
  response_time_ms: responseTime,
  cost_estimate: 0.08,
  image_size_bytes: bytes.length,
  image_format: "png",
  storage_location: "/api/media/uuid.png",
  status: "success"
});
```

---

## Summary

| Aspect | Current | Limitation | Future |
|--------|---------|-----------|--------|
| **API** | OpenAI DALL-E 3 | Requires API key + cost | Stable Diffusion, Midjourney |
| **Storage** | Local `.data/media/` | Dev only | Cloud storage (S3/GCS) |
| **Cost** | ~$0.08/image | High volume = expensive | Cheaper alternatives |
| **Quality** | High editorial | Unpredictable | Custom fine-tuning |
| **Caching** | None | New image each paper | Reuse for similar topics |
| **Variations** | Single | Limited choice | Multi-option selection |
| **Speed** | 30-60s | Slow | Cache / batch generation |

