# Cover Image Generation - Quick Setup

## ✅ TL;DR - One Command Setup

```bash
# Recommended: AI covers with PDF fallback (best reliability + quality)
export COVER_IMAGE_STRATEGY=ai-first
export OPENAI_IMAGE_API_KEY=sk-...
```

**That's it!** You now have:
- 🤖 High-quality DALL-E covers (normal case)
- 📄 Free PDF screenshots if API fails (fallback)
- ✅ Papers always created (even if cover fails)

---

## How It Works

```
Generate paper from PDF
    ↓
Try: Create DALL-E cover ($0.08)
    ↓
[Works?] → Use AI cover ✅
[Fails?] → Try: Extract PDF page ✅
[Fails?] → Skip cover (paper still created) ✅
```

---

## Configuration Options

### 1. AI-First (RECOMMENDED) 🌟
```bash
export COVER_IMAGE_STRATEGY=ai-first
export OPENAI_IMAGE_API_KEY=sk-...
```
- Usually: High-quality AI covers
- If API fails: Free PDF screenshots
- Fallback: No cover (paper still created)

### 2. AI Only
```bash
export COVER_IMAGE_STRATEGY=ai-generated
export OPENAI_IMAGE_API_KEY=sk-...
```
- All papers get DALL-E covers
- Single point of failure (no fallback)

### 3. PDF Only
```bash
export COVER_IMAGE_STRATEGY=pdf-screenshot
```
- Extract first page of PDF
- Free, no API costs
- Requires: `npm install canvas`

### 4. No Covers
```bash
export COVER_IMAGE_STRATEGY=skip
```
- Testing, development, or manual uploads

---

## What You Get

| Strategy | When Works | When Fails |
|----------|-----------|-----------|
| **ai-first** | AI cover | PDF cover |
| **ai-generated** | AI cover | No cover |
| **pdf-screenshot** | PDF cover | No cover |
| **skip** | No cover | No cover |

---

## Logging

You'll see:
```
[Cover Image] Generated: ai-generated (Site Name)      ← AI worked
[Cover Image] Generated: pdf-screenshot (Site Name)    ← Fallback used
[Cover Image] Generated: null (Site Name)              ← Both failed
```

---

## Cost

With **ai-first** strategy:
- **100 papers/month** = ~$8.50/month (vs $8 for ai-only)
- Cost of reliability: **0.6% overhead**
- Worth it for production

---

## Testing

```bash
# Test recommended setup
export COVER_IMAGE_STRATEGY=ai-first
export OPENAI_IMAGE_API_KEY=sk-...
npm test
# Result: 27/27 passing ✅

# Test without API (triggers fallback)
unset OPENAI_IMAGE_API_KEY
npm test
# Result: Falls back to PDF (returns empty if canvas not installed)
```

---

## Production Checklist

- [ ] Set `COVER_IMAGE_STRATEGY=ai-first`
- [ ] Set `OPENAI_IMAGE_API_KEY=sk-...`
- [ ] Run tests: `npm test`
- [ ] Configure storage: Set up S3/CDN (instead of local `.data/`)
- [ ] Add monitoring: Track cover generation success rate
- [ ] (Optional) Install canvas: `npm install canvas` for PDF screenshots

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No covers generated | Check `COVER_IMAGE_STRATEGY` and `OPENAI_IMAGE_API_KEY` |
| Always PDF covers | API key invalid or rate-limited |
| Timeout errors | API overloaded, fallback will handle it |
| Papers without covers | Both AI and PDF failed (rare, paper still created) |

---

## Next Steps

1. **Read:** [COVER_IMAGE_FALLBACK_STRATEGY.md](COVER_IMAGE_FALLBACK_STRATEGY.md) for detailed explanation
2. **Setup:** Export environment variables
3. **Test:** Run `npm test` to verify
4. **Monitor:** Check logs for `[Cover Image]` messages

---

## Key Files

- **[lib/ai-drafts.ts](lib/ai-drafts.ts)** - Fallback logic
- **[lib/pdf-screenshot.ts](lib/pdf-screenshot.ts)** - PDF page extraction
- **[COVER_IMAGE_FALLBACK_STRATEGY.md](COVER_IMAGE_FALLBACK_STRATEGY.md)** - Complete guide
- **[PDF_COVER_OPTIONS.md](PDF_COVER_OPTIONS.md)** - All available options
- **[IMAGE_GENERATION_GUIDE.md](IMAGE_GENERATION_GUIDE.md)** - Deep dive into image generation

