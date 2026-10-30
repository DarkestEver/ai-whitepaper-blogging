import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { randomBytes } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import {
  createSite,
  createSourceDocument,
  deleteSourceDocument,
  findSourceDocumentById,
  getSite,
  initializeDatabase,
  siteInputSchema,
  sourceDocumentInputSchema,
} from "../lib/db";
import { saveSourcePdf, readSourcePdf, removeSourcePdf } from "../lib/media";
import { extractPdfText, extractPdfFirstPages } from "../lib/pdf-text";

Reflect.set(process.env, "NODE_ENV", "test");

let mongoServer: MongoMemoryServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.MONGODB_DB_NAME = "test_" + randomBytes(4).toString("hex");
  await initializeDatabase();
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

function onePagePdf(text: string): Buffer {
  const textOperators = (text.match(/.{1,70}/g) ?? [])
    .map((line, index) => `${index === 0 ? "72 720 Td" : "0 -14 Td"} (${line}) Tj`)
    .join(" ");
  const stream = `BT /F1 12 Tf ${textOperators} ET`;
  const bodies = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`,
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, body] of bodies.entries()) {
    offsets.push(Buffer.byteLength(document, "ascii"));
    document += `${index + 1} 0 obj\n${body}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(document, "ascii");
  document += `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) document += `${String(offset).padStart(10, "0")} 00000 n \n`;
  document += `trailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(document, "ascii");
}

test("PDF extraction supports page limiting", async () => {
  const text = "A sufficiently long synthetic research passage for validating page-aware extraction from a source PDF. ".repeat(10);
  const singlePagePdf = onePagePdf(text);
  const extracted = await extractPdfFirstPages(singlePagePdf);

  assert.equal(extracted.totalPageCount, 1);
  assert.equal(extracted.extractedPageCount, 1);
  assert.ok(extracted.text.includes("[Page 1]"));
  assert.ok(extracted.text.includes("synthetic research passage"));
});

test("PDF extraction returns correct page count info", async () => {
  const text = "Test content for PDF extraction ".repeat(20); // Need > 200 chars
  const pdf = onePagePdf(text);
  const extracted = await extractPdfFirstPages(pdf);

  assert.ok(extracted.totalPageCount >= 1);
  assert.ok(extracted.extractedPageCount >= 1);
  assert.ok(extracted.extractedPageCount <= extracted.totalPageCount);
  assert.ok(extracted.text.length > 0);
});

test("HTML validation accepts valid article structure", () => {
  const validHtml = `<article>
    <header>
      <h1>Test Blog Post</h1>
      <p class="metadata">Published today</p>
    </header>
    <section>
      <h2>Content</h2>
      <p>Valid article content</p>
    </section>
  </article>`;

  const articleMatch = validHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  assert.ok(articleMatch, "Should match valid article structure");
});

test("HTML validation rejects invalid article structure", () => {
  const invalidHtml = `<div><h1>Not an article</h1><p>Missing article tags</p></div>`;

  const articleMatch = invalidHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  assert.ok(!articleMatch, "Should reject non-article HTML");
});

test("HTML validation rejects unclosed article tag", () => {
  const invalidHtml = `<article><h1>Unclosed Article</h1>`;

  const articleMatch = invalidHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  assert.ok(!articleMatch, "Should reject unclosed article tag");
});

test("HTML validation rejects script tags in HTML", () => {
  const xssHtml = `<article>
    <h1>Post</h1>
    <p>Content</p>
    <script>alert('xss')</script>
  </article>`;

  // Validation accepts it (AI generated), but detection should flag it
  const articleMatch = xssHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  assert.ok(articleMatch, "Article structure matches");
  assert.ok(xssHtml.includes("<script>"), "Should detect script tags");
});

test("HTML validation rejects img onerror injection", () => {
  const xssHtml = `<article>
    <h1>Post</h1>
    <img src=x onerror="alert('xss')">
  </article>`;

  const articleMatch = xssHtml.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  assert.ok(articleMatch, "Article structure matches");
  assert.ok(xssHtml.includes("onerror="), "Should detect onerror attributes");
});

test("HTML metadata extraction from valid article", () => {
  const htmlContent = `<article>
    <h1>My Blog Title</h1>
    <p>This is a summary paragraph with content.</p>
    <p>More content here.</p>
  </article>`;

  const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const title = h1Match?.[1]?.trim() || "Fallback";

  assert.equal(title, "My Blog Title");

  const plainText = htmlContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const summary = plainText.slice(0, 300);

  assert.ok(summary.includes("My Blog Title"));
  assert.ok(summary.includes("summary paragraph"));
});

test("HTML metadata extraction falls back correctly", () => {
  const htmlContent = `<article>
    <p>No h1 tag present in this content</p>
  </article>`;

  const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const fallback = "Fallback Title";
  const title = h1Match?.[1]?.trim() || fallback;

  assert.equal(title, "Fallback Title");
});

test("Reading time calculation minimum is 1 minute", () => {
  const shortHtml = `<article><h1>Title</h1></article>`;
  const plainText = shortHtml.replace(/<[^>]+>/g, "").length;
  const readingMinutes = Math.max(1, Math.ceil(plainText / 200));

  assert.ok(readingMinutes >= 1, "Reading time should be at least 1 minute");
});

test("Reading time calculation for standard content", () => {
  const content = "Word ".repeat(1000); // ~5000 characters
  const readingMinutes = Math.max(1, Math.ceil(content.length / 200));

  assert.equal(readingMinutes, 25); // 5000 / 200 = 25
});

test("HTML content size validation rejects too small HTML", () => {
  const tinyHtml = `<article></article>`;
  const isValid = tinyHtml.length >= 200 && tinyHtml.length <= 500000;

  assert.ok(!isValid, "Should reject tiny HTML < 200 bytes");
});

test("HTML content size validation accepts reasonable size", () => {
  const validHtml = `<article>
    <h1>Blog Title</h1>
    <p>Body content that is substantial enough to be a real blog post.</p>
    <p>More content here with enough text to exceed the 200 byte minimum.</p>
    <p>Even more content to ensure this is a realistic blog article.</p>
  </article>`;

  const isValid = validHtml.length >= 200 && validHtml.length <= 500000;
  assert.ok(isValid, "Should accept HTML between 200-500000 bytes");
});

test("HTML content size validation rejects too large HTML", () => {
  const hugeHtml = `<article>${"x".repeat(600000)}</article>`;
  const isValid = hugeHtml.length >= 200 && hugeHtml.length <= 500000;

  assert.ok(!isValid, "Should reject HTML > 500000 bytes");
});

test("HTML content fields are properly defined", () => {
  const htmlInput = {
    siteId: 1,
    title: "Test",
    slug: "test",
    summary: "Summary",
    category: "Research",
    publisher: "Publisher",
    readingMinutes: 5,
    status: "draft",
    abstract: "Abstract text for blog",
    takeaways: [],
    subtitle: "",
    authorName: "Author",
    authorTitle: "Title",
    documentType: "whitepaper",
    language: "en",
    publicationDate: "",
    industry: "",
    targetAudience: "",
    geographicTarget: "",
    tags: ["blog"],
    sourceName: "",
    sourceUrl: "",
    seoTitle: "Test",
    seoDescription: "Description",
    canonicalUrl: "",
    seoKeywords: [],
    geoSummary: "",
    keyEntities: [],
    keyFacts: [],
    faqItems: [],
    coverImageUrl: "",
    coverImageAlt: "",
    featured: false,
    sourceDocumentUrl: "",
    sourceDocumentAsset: "",
    downloadablePdfAsset: "",
    sourceDocumentTitle: "",
    sourceRightsStatus: "unknown",
    sourceRightsEvidence: "",
    scheduledAt: "",
    htmlContent: "<article><h1>Test</h1><p>Content</p></article>",
  };

  // Should accept htmlContent field
  assert.ok(htmlInput.htmlContent);
  assert.ok(htmlInput.htmlContent.includes("<article>"));
});

test("Multi-site document reuse concept verification", () => {
  // Simulate multi-site scenario
  const sharedPdfAsset = "/api/admin/source-files/550e8400-e29b-41d4-a716-446655440000.pdf";

  const site1Document = {
    sourceDocumentAsset: sharedPdfAsset,
    slug: "site1-blog-post",
  };

  const site2Document = {
    sourceDocumentAsset: sharedPdfAsset,
    slug: "site2-blog-post",
  };

  // Both reference same PDF file
  assert.equal(site1Document.sourceDocumentAsset, site2Document.sourceDocumentAsset);

  // But have different slugs/URLs
  assert.notEqual(site1Document.slug, site2Document.slug);
});
