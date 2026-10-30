import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { randomBytes } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { categories } from "../lib/catalog";
import {
  createWhitepaper,
  createSite,
  createSourceDocument,
  deleteSourceDocument,
  deleteWhitepaper,
  approveWhitepaperReview,
  findWhitepaperById,
  findWhitepaperRecordForSite,
  findSourceDocumentById,
  getSite,
  initializeDatabase,
  listEditorialReviewEvents,
  listLocalAuditEvents,
  listSites,
  listWhitepapers,
  markSourceDocumentGenerated,
  paperInputSchema,
  publishDueScheduledPapers,
  requestWhitepaperChanges,
  resolveSiteForHost,
  siteInputSchema,
  sourceDocumentInputSchema,
  sourceScheduleBatchSchema,
  submitWhitepaperForReview,
  updateSite,
  updateSourceDocument,
  updateWhitepaper,
} from "../lib/db";
import { findThemePreset, themePresets } from "../lib/themes";
import { requestProviderText, type Provider } from "../lib/ai-providers";
import { hashAdminPassword, verifyAdminPassword } from "../lib/password";
import { assertKillSwitchOff, FeatureUnavailableError, isSameOriginPost, KillSwitchError, RequestValidationError, safeErrorResponse } from "../lib/admin-http";
import { readCoverImage, readSourcePdf, removeCoverImage, removeSourcePdf, saveCoverImage, saveSourcePdf } from "../lib/media";
import { extractPdfText } from "../lib/pdf-text";
import { formatSiteEditorialContext } from "../lib/site-context";

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

test("theme catalog contains six families with six unique draft presets each", () => {
  assert.equal(themePresets.length, 36);
  assert.equal(new Set(themePresets.map((preset) => preset.id)).size, 36);
  assert.equal(new Set(themePresets.map((preset) => preset.family)).size, 6);
  for (const family of new Set(themePresets.map((preset) => preset.family))) {
    assert.equal(themePresets.filter((preset) => preset.family === family).length, 6);
  }
  assert.ok(themePresets.every((preset) => preset.status === "draft"));
});

test("PDF text extraction retains page numbers and rejects scanned textless PDFs", async () => {
  const text = "A sufficiently long synthetic research passage for validating page-aware extraction from a source PDF. ".repeat(3);
  const extracted = await extractPdfText(onePagePdf(text));
  assert.equal(extracted.pageCount, 1);
  assert.match(extracted.text, /\[Page 1\]/);
  assert.match(extracted.text, /synthetic research passage/);
  await assert.rejects(extractPdfText(onePagePdf("tiny")), FeatureUnavailableError);
  await assert.rejects(extractPdfText(Buffer.from("not a PDF")), RequestValidationError);

  const oversized = Buffer.alloc(20 * 1024 * 1024 + 1);
  oversized.write("%PDF-");
  await assert.rejects(extractPdfText(oversized), RequestValidationError);

  const longText = await extractPdfText(onePagePdf("Research text ".repeat(12_000)));
  assert.ok(longText.text.length <= 110_000);
  assert.match(longText.text, /\[Page 1\]/);
});

test("admin password hashing verifies securely and rejects malformed or incorrect values", () => {
  const password = "local-prototype-password";
  const encoded = hashAdminPassword(password);
  assert.equal(verifyAdminPassword(password, encoded), true);
  assert.equal(verifyAdminPassword("incorrect-password", encoded), false);
  assert.equal(verifyAdminPassword(password, "not-a-password-hash"), false);
});

test("admin mutations reject cross-origin and missing-Origin requests", () => {
  const sameOrigin = new Request("http://localhost:3000/api/admin/content", {
    method: "POST",
    headers: { host: "localhost:3000", origin: "http://localhost:3000" },
  });
  const crossOrigin = new Request("http://localhost:3000/api/admin/content", {
    method: "POST",
    headers: { host: "localhost:3000", origin: "https://attacker.example" },
  });
  const missingOrigin = new Request("http://localhost:3000/api/admin/content", {
    method: "POST",
    headers: { host: "localhost:3000" },
  });
  assert.equal(isSameOriginPost(sameOrigin), true);
  assert.equal(isSameOriginPost(crossOrigin), false);
  assert.equal(isSameOriginPost(missingOrigin), false);
});

test("site schema accepts only registered theme IDs", async () => {
  const site = await getSite();
  assert.equal(siteInputSchema.safeParse({ name: site.name, description: site.description, themeId: site.themeId }).success, true);
  assert.equal(siteInputSchema.safeParse({ name: site.name, description: site.description, themeId: "unregistered-theme" }).success, false);
  assert.equal(siteInputSchema.safeParse({
    name: site.name,
    description: site.description,
    themeId: site.themeId,
    publicUrl: "https://research.example",
  }).success, true);
  for (const publicUrl of ["http://research.example", "https://user:pass@research.example", "https://research.example/path", "javascript:alert(1)"]) {
    assert.equal(siteInputSchema.safeParse({
      name: site.name,
      description: site.description,
      themeId: site.themeId,
      publicUrl,
    }).success, false, `${publicUrl} should be rejected`);
  }
  assert.equal(siteInputSchema.safeParse({
    name: site.name,
    description: site.description,
    themeId: site.themeId,
    publicUrl: "http://localhost:3000",
  }).success, true);
});

test("AI site context includes the configured domain without treating it as factual evidence", () => {
  const context = formatSiteEditorialContext({
    name: "Example Research",
    publicUrl: "https://www.example.com",
    description: "Independent, evidence-led analysis for technology leaders.",
  });
  assert.match(context, /Domain: www\.example\.com/);
  assert.match(context, /technology leaders/);
  assert.match(context, /Public base URL: https:\/\/www\.example\.com/);
});

test("AI text adapters implement mock-tested OpenAI, Anthropic, and Gemini contracts", async () => {
  const cases: Array<{
    provider: Provider;
    response: unknown;
    expectedText: string;
    expectedUrl: RegExp;
    expectedHeader: string;
  }> = [
    {
      provider: "openai",
      response: { choices: [{ message: { content: "{\"draft\":true}" } }] },
      expectedText: "{\"draft\":true}",
      expectedUrl: /api\.openai\.com\/v1\/chat\/completions$/,
      expectedHeader: "authorization",
    },
    {
      provider: "anthropic",
      response: { content: [{ type: "text", text: "{\"draft\":true}" }] },
      expectedText: "{\"draft\":true}",
      expectedUrl: /api\.anthropic\.com\/v1\/messages$/,
      expectedHeader: "x-api-key",
    },
    {
      provider: "google",
      response: { candidates: [{ content: { parts: [{ text: "{\"draft\":" }, { text: "true}" }] } }] },
      expectedText: "{\"draft\":true}",
      expectedUrl: /generativelanguage\.googleapis\.com\/v1beta\/models\/test-model:generateContent\?key=test-key$/,
      expectedHeader: "content-type",
    },
  ];

  for (const providerCase of cases) {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    const fetcher: typeof fetch = async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify(providerCase.response), { status: 200 });
    };
    const result = await requestProviderText(providerCase.provider, "test-key", "test-model", "test prompt", fetcher);
    assert.equal(result, providerCase.expectedText);
    assert.match(requestUrl, providerCase.expectedUrl);
    assert.ok(new Headers(requestInit?.headers).has(providerCase.expectedHeader));
    const body = JSON.parse(String(requestInit?.body)) as Record<string, unknown>;
    assert.ok(body.model === "test-model" || providerCase.provider === "google");
    if (providerCase.provider === "openai") {
      assert.deepEqual(body.response_format, { type: "json_object" });
      assert.equal(body.max_completion_tokens, 8000);
    } else if (providerCase.provider === "anthropic") {
      assert.equal(body.max_tokens, 8000);
    } else {
      assert.deepEqual(body.generationConfig, {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 8000,
      });
    }
  }

  await assert.rejects(requestProviderText("openai", "test-key", "test-model", "test prompt", async () =>
    new Response(JSON.stringify({ choices: [] }), { status: 200 })), /unexpected response shape/);
});

test("registered domains resolve only to their site and public content stays site-scoped", async () => {
  const site = await createSite({
    name: "Alpha Research",
    slug: "alpha-research",
    description: "Independent local test site for site-scoped rendering.",
    themeId: "research-report-index",
    publicUrl: "https://alpha.example",
  });
  const defaultSite = await getSite();
  assert.equal((await resolveSiteForHost("ALPHA.EXAMPLE:443"))?.id, site.id);
  assert.equal((await resolveSiteForHost("localhost:3000"))?.id, defaultSite.id);
  assert.equal(await resolveSiteForHost("unregistered.example"), undefined);
  assert.equal(await resolveSiteForHost("attacker.example,alpha.example"), undefined);
  await assert.rejects(createSite({
    name: "Duplicate Domain",
    slug: "duplicate-domain",
    description: "A second local test site with duplicate domain.",
    themeId: "research-report-index",
    publicUrl: "https://alpha.example/",
  }), RequestValidationError);
  await assert.rejects(updateSite({
    name: site.name,
    slug: "changed-site-slug",
    description: site.description,
    themeId: site.themeId,
    publicUrl: site.publicUrl,
  }, site.id), RequestValidationError);

  const paperInput = paperInputSchema.parse({
    siteId: site.id,
    title: "Alpha Site Scoped Article",
    slug: "alpha-site-scoped-article",
    summary: "This synthetic entry verifies per-site public catalog isolation.",
    category: categories[0],
    publisher: site.name,
    readingMinutes: 5,
    status: "draft",
    abstract: "This synthetic abstract is only for local testing and site-scoped content isolation behavior.",
    takeaways: ["The article belongs to the alpha site."],
    sourceRightsStatus: "allowed",
    sourceRightsEvidence: "Synthetic test content with no external source material used.",
  });
  const paper = await createWhitepaper(paperInput);
  await submitWhitepaperForReview(paper.id);
  await approveWhitepaperReview(paper.id);
  const published = await updateWhitepaper(paper.id, { ...paperInput, status: "published" });
  assert.equal(published.siteId, site.id);
  assert.equal((await findWhitepaperRecordForSite(paper.slug, site.id))?.id, paper.id);
  assert.equal(await findWhitepaperRecordForSite(paper.slug, defaultSite.id), undefined);
  assert.equal((await listWhitepapers({ siteId: site.id })).some((item) => item.id === paper.id), true);
  assert.equal((await listWhitepapers({ siteId: defaultSite.id })).some((item) => item.id === paper.id), false);
  await deleteWhitepaper(paper.id);
});

test("content metadata validates SEO URLs and requires image alt text", () => {
  const base = {
    title: "Metadata Test Entry",
    slug: "metadata-test-entry",
    summary: "A valid summary used to exercise metadata validation.",
    category: categories[1],
    publisher: "Signal Research Desk",
    readingMinutes: 6,
    status: "draft",
    abstract: "This synthetic record contains a sufficiently long abstract for metadata testing.",
    takeaways: ["Metadata is checked."],
    sourceRightsStatus: "allowed",
    sourceRightsEvidence: "Synthetic metadata test with no external sources used here.",
  };
  assert.equal(paperInputSchema.safeParse({ ...base, canonicalUrl: "javascript:alert(1)" }).success, false);
  assert.equal(paperInputSchema.safeParse({ ...base, canonicalUrl: "https://user:pass@example.com/path" }).success, false);
  assert.equal(paperInputSchema.safeParse({ ...base, sourceUrl: "file:///etc/passwd" }).success, false);
  assert.equal(paperInputSchema.safeParse({ ...base, publicationDate: "2026-02-31" }).success, false);
  assert.equal(paperInputSchema.safeParse({ ...base, coverImageUrl: "/api/media/example.png" }).success, false);
  assert.equal(paperInputSchema.safeParse({
    ...base,
    coverImageUrl: "/api/media/example.png",
    coverImageAlt: "A research chart",
    faqItems: [{ question: "What does this demonstrate?", answer: "It demonstrates metadata validation." }],
  }).success, true);
});

test("cover uploads reject spoofed file types and serve/remove validated image assets", async () => {
  const spoofed = new File([Buffer.from("<svg></svg>")], "cover.png", { type: "image/png" });
  await assert.rejects(saveCoverImage(spoofed), RequestValidationError);
  assert.equal(safeErrorResponse(new RequestValidationError("Invalid image.")).status, 400);

  const png = new File([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])], "cover.png", {
    type: "image/png",
  });
  const url = await saveCoverImage(png);
  try {
    const asset = url.slice("/api/media/".length);
    const served = await readCoverImage(asset);
    assert.equal(served?.contentType, "image/png");
    assert.equal(served?.bytes.byteLength, 9);
  } finally {
    await removeCoverImage(url);
  }
  assert.equal(await readCoverImage(url.slice("/api/media/".length)), undefined);
});

test("source PDF uploads require a PDF signature and can be retrieved only as validated assets", async () => {
  const fakePdf = new File(["not a pdf"], "source.pdf", { type: "application/pdf" });
  await assert.rejects(saveSourcePdf(fakePdf), RequestValidationError);
  const pdf = new File(["%PDF-1.7\nlocal test"], "source.pdf", { type: "application/pdf" });
  const url = await saveSourcePdf(pdf);
  try {
    const asset = url.slice("/api/admin/source-files/".length);
    const saved = await readSourcePdf(asset);
    assert.equal(saved?.subarray(0, 5).toString("ascii"), "%PDF-");
  } finally {
    await removeSourcePdf(url);
  }
  assert.equal(await readSourcePdf(url.slice("/api/admin/source-files/".length)), undefined);
});

test("local site setting changes persist and return to the original value", async () => {
  const original = await getSite();
  const nextTheme = findThemePreset("technical-engineering-notes");
  assert.ok(nextTheme);
  await updateSite({
    name: "Prototype Journal",
    description: "A prototype site description that passes validation.",
    themeId: nextTheme.id,
    publicUrl: "https://www.prototype.example",
  });
  assert.equal((await getSite()).name, "Prototype Journal");
  assert.equal((await getSite()).themeId, nextTheme.id);
  assert.equal((await getSite()).publicUrl, "https://www.prototype.example");
  await updateSite({
    name: original.name,
    description: original.description,
    themeId: original.themeId,
    publicUrl: original.publicUrl,
  });
  assert.equal((await getSite()).name, original.name);
  assert.equal((await getSite()).publicUrl, original.publicUrl);
});

test("content CRUD persists drafts without exposing them publicly and records audit events", async () => {
  const unique = randomBytes(6).toString("hex");
  const input = paperInputSchema.parse({
    title: "A Safe Local Prototype Entry",
    slug: `safe-local-prototype-${unique}`,
    summary: "A valid summary for the local prototype content record.",
    category: categories[1],
    publisher: "Signal Research Desk",
    readingMinutes: 6,
    status: "draft",
    abstract: "This synthetic test record is long enough to pass validation and should stay private until it is explicitly published.",
    takeaways: ["This test record remains a draft."],
    sourceRightsStatus: "allowed",
    sourceRightsEvidence: "Original synthetic test text with no external source material used.",
    subtitle: "A metadata persistence test",
    authorName: "Test Researcher",
    authorTitle: "Research Lead",
    documentType: "research_report",
    language: "en-GB",
    publicationDate: "2026-10-25",
    industry: "Technology",
    targetAudience: "Enterprise engineering leaders",
    geographicTarget: "United Kingdom",
    tags: ["Research", "Testing"],
    sourceName: "Independent Research Desk",
    sourceUrl: "https://example.com/source",
    seoTitle: "Metadata test SEO title",
    seoDescription: "Metadata test search description for this content.",
    canonicalUrl: "https://example.com/research/metadata-test",
    seoKeywords: ["enterprise research", "testing"],
    geoSummary: "The key answer in one concise paragraph.",
    keyEntities: ["Example Research Desk"],
    keyFacts: ["This measured finding is included as a synthetic test fact."],
    faqItems: [{ question: "What is this test?", answer: "It checks that editorial metadata persists in MongoDB." }],
    coverImageUrl: "/api/media/12345678-1234-4234-8234-123456789abc.png",
    coverImageAlt: "A sample data visualization",
    featured: true,
  });
  const before = (await listWhitepapers()).length;
  const auditWatermark = (await listLocalAuditEvents(100))[0]?.id ?? 0;
  const created = await createWhitepaper(input);
  assert.equal(created.status, "draft");
  await assert.rejects(createWhitepaper({ ...input, status: "published" }), RequestValidationError);
  assert.equal(created.seoTitle, "Metadata test SEO title");
  assert.equal(created.geoSummary, "The key answer in one concise paragraph.");
  assert.equal(created.geographicTarget, "United Kingdom");
  assert.deepEqual(created.faqItems, input.faqItems);
  assert.equal(created.coverImageAlt, "A sample data visualization");
  assert.equal(created.featured, true);
  assert.equal((await listWhitepapers()).length, before);
  assert.equal((await findWhitepaperById(created.id))?.status, "draft");

  await assert.rejects(updateWhitepaper(created.id, { ...input, status: "published" }), RequestValidationError);
  await assert.rejects(updateWhitepaper(created.id, {
    ...input,
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 60_000).toISOString(),
  }), RequestValidationError);
  await submitWhitepaperForReview(created.id);
  assert.equal((await findWhitepaperById(created.id))?.editorialStatus, "in_review");
  await assert.rejects(updateWhitepaper(created.id, { ...input, status: "published" }), RequestValidationError);
  await requestWhitepaperChanges(created.id, "Add a clear evidence note.");
  assert.equal((await findWhitepaperById(created.id))?.editorialStatus, "changes_requested");
  await submitWhitepaperForReview(created.id);
  await approveWhitepaperReview(created.id);
  const published = await updateWhitepaper(created.id, { ...input, status: "published" });
  assert.equal(published.status, "published");
  assert.equal(published.editorialStatus, "approved");
  assert.equal(published.canonicalUrl, "https://example.com/research/metadata-test");
  assert.equal((await listWhitepapers()).some((paper) => paper.id === created.id), true);

  const edited = await updateWhitepaper(created.id, {
    ...input,
    status: "published",
    title: "An Edited Safe Local Prototype Entry",
  });
  assert.equal(edited.status, "draft");
  assert.equal(edited.editorialStatus, "draft");
  assert.equal((await listWhitepapers()).some((paper) => paper.id === created.id), false);
  assert.deepEqual((await listEditorialReviewEvents(created.id)).map((event) => event.action), [
    "submitted", "changes_requested", "submitted", "approved",
  ]);

  await deleteWhitepaper(created.id);
  assert.equal(await findWhitepaperById(created.id), undefined);
  const entityEvents = (await listLocalAuditEvents(100)).filter((event) => event.id > auditWatermark && event.entity === "whitepaper" && event.entityId === String(created.id));
  assert.deepEqual(entityEvents.map((event) => event.action).sort(), [
    "created", "deleted", "editorial-approved", "editorial-changes-requested",
    "editorial-submitted", "editorial-submitted", "updated", "updated",
  ]);
});

test("scheduled entries stay private until due and publish only with cleared rights", async () => {
  const futureAt = new Date(Date.now() + 60 * 60 * 1000);
  const unique = randomBytes(6).toString("hex");
  const input = paperInputSchema.parse({
    title: "A Scheduled Local Prototype Entry",
    slug: `scheduled-local-prototype-${unique}`,
    summary: "A valid summary for the scheduled local prototype content record.",
    category: categories[1],
    publisher: "Signal Research Desk",
    readingMinutes: 6,
    status: "draft",
    abstract: "This scheduled synthetic record verifies publication time behavior and remains hidden until due.",
    takeaways: ["The schedule stays private until due."],
    sourceRightsStatus: "allowed",
    sourceRightsEvidence: "Synthetic test content authored locally; no third-party sources used.",
    scheduledAt: futureAt.toISOString(),
  });
  const created = await createWhitepaper(input);
  await submitWhitepaperForReview(created.id);
  await approveWhitepaperReview(created.id);
  const scheduled = await updateWhitepaper(created.id, { ...input, status: "scheduled" });
  assert.equal(scheduled.status, "scheduled");
  assert.equal((await listWhitepapers()).some((paper) => paper.id === created.id), false);

  await publishDueScheduledPapers(new Date(futureAt.getTime() + 1000));
  const publishedPaper = await findWhitepaperById(created.id);
  assert.equal(publishedPaper?.status, "published");
  assert.equal(publishedPaper?.publicationDate, futureAt.toISOString().slice(0, 10));
  assert.equal((await listWhitepapers()).some((paper) => paper.id === created.id), true);

  await deleteWhitepaper(created.id);
});

test("scheduling and publishing reject content without cleared rights evidence", () => {
  const base = {
    title: "Rights Gate Example",
    slug: "rights-gate-example",
    summary: "A valid summary for a rights gate test record.",
    category: categories[1],
    publisher: "Signal Research Desk",
    readingMinutes: 6,
    abstract: "This content is a synthetic sample for validating the rights publishing gate.",
    takeaways: ["Unknown rights do not pass."],
  };
  assert.equal(paperInputSchema.safeParse({ ...base, status: "published" }).success, false);
  assert.equal(paperInputSchema.safeParse({
    ...base,
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 60_000).toISOString(),
  }).success, false);
  assert.equal(paperInputSchema.safeParse({
    ...base,
    status: "scheduled",
    scheduledAt: "2030-01-01T10:00",
    sourceRightsStatus: "allowed",
    sourceRightsEvidence: "Original, approved material under the publisher's own rights.",
  }).success, false);
  assert.equal(paperInputSchema.safeParse({
    ...base,
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 60_000).toISOString(),
    sourceRightsStatus: "allowed",
    sourceRightsEvidence: "Too short.",
  }).success, false);
});

test("source library validates bulk targets and supports editable per-PDF schedules", async () => {
  const sites = await listSites();
  const site = sites[0];
  assert.ok(site);
  const sourceUrl = "https://publisher.example/reports/market-outlook.pdf";
  const schedule = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const input = sourceDocumentInputSchema.parse({
    title: "Market Outlook Source",
    sourceUrl,
    scheduledAt: schedule,
    targetSiteSlugs: [site.slug],
    rightsStatus: "unknown",
    rightsEvidence: "",
  });
  const source = await createSourceDocument(input);
  assert.equal(source.status, "scheduled");
  assert.equal(source.sourceUrl, sourceUrl);
  assert.deepEqual(source.targetSiteSlugs, [site.slug]);
  assert.equal(sourceDocumentInputSchema.safeParse({ ...input, scheduledAt: "" }).success, false);

  const updatedSchedule = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const updated = await updateSourceDocument(source.id, { ...input, scheduledAt: updatedSchedule });
  assert.equal(updated.status, "scheduled");
  assert.equal(updated.scheduledAt, updatedSchedule);
  assert.equal((await findSourceDocumentById(source.id))?.scheduledAt, updatedSchedule);
  await assert.rejects(createSourceDocument({ ...input, scheduledAt: updatedSchedule }), RequestValidationError);
  assert.equal(sourceDocumentInputSchema.safeParse({
    ...input,
    targetSiteSlugs: ["not-a-registered-site"],
  }).success, true);
  await assert.rejects(updateSourceDocument(source.id, {
    ...input,
    targetSiteSlugs: ["not-a-registered-site"],
  }), RequestValidationError);
  await deleteSourceDocument(source.id);
  assert.equal(await findSourceDocumentById(source.id), undefined);
});

test("bulk source schedules require unique future calendar dates", () => {
  const firstDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const secondDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const firstLocalDate = firstDate.toISOString().slice(0, 10);
  const secondLocalDate = secondDate.toISOString().slice(0, 10);
  const valid = [
    { scheduledAt: firstDate.toISOString(), localDate: firstLocalDate },
    { scheduledAt: secondDate.toISOString(), localDate: secondLocalDate },
  ];
  assert.equal(sourceScheduleBatchSchema.safeParse(valid).success, true);
  assert.equal(sourceScheduleBatchSchema.safeParse([
    valid[0],
    { scheduledAt: new Date(firstDate.getTime() + 60 * 60 * 1000).toISOString(), localDate: firstLocalDate },
  ]).success, false);
  assert.equal(sourceScheduleBatchSchema.safeParse([
    { scheduledAt: "2035-06-02T09:00:00.000Z", localDate: "2035-06-02" },
    { scheduledAt: "2035-06-02T12:00:00.000Z", localDate: "2035-06-03" },
  ]).success, false);
  assert.equal(sourceScheduleBatchSchema.safeParse([
    ...valid,
    { scheduledAt: new Date(Date.now() - 1000).toISOString(), localDate: new Date(Date.now() - 1000).toISOString().slice(0, 10) },
  ]).success, false);
});

test("generated source schedules remain editable without allowing silent re-generation", async () => {
  const sites = await listSites();
  const site = sites[0];
  assert.ok(site);
  const input = sourceDocumentInputSchema.parse({
    title: "Generated Source",
    sourceUrl: "https://publisher.example/reports/generated-source.pdf",
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    targetSiteSlugs: [site.slug],
  });
  const source = await createSourceDocument(input);
  const paper = await createWhitepaper(paperInputSchema.parse({
    title: "Generated Draft for Source",
    slug: `generated-draft-source-${randomBytes(4).toString("hex")}`,
    summary: "A draft generated for testing source-document references and schedules.",
    category: categories[0],
    publisher: "Test Research Desk",
    readingMinutes: 5,
    status: "draft",
    abstract: "This synthetic abstract tests source record linkage and must meet the minimum length constraints.",
    takeaways: ["Generated content remains a review draft."],
    sourceDocumentUrl: input.sourceUrl,
  }));
  await markSourceDocumentGenerated(source.id, [paper.id]);
  const schedule = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const scheduled = await updateSourceDocument(source.id, { ...input, scheduledAt: schedule });
  assert.equal(scheduled.status, "generated");
  assert.deepEqual(scheduled.generatedPaperIds, [paper.id]);
  await assert.rejects(updateSourceDocument(source.id, { ...input, title: "Changed source title" }), RequestValidationError);
  await assert.rejects(deleteSourceDocument(source.id), RequestValidationError);

  await deleteWhitepaper(paper.id);
  const updatedSource = await findSourceDocumentById(source.id);
  assert.deepEqual(updatedSource?.generatedPaperIds, []);
  assert.equal(updatedSource?.status, "scheduled");
  const newContent = sourceDocumentInputSchema.safeParse({
    ...input,
    scheduledAt: new Date(Date.now() - 1000).toISOString(),
  });
  assert.equal(newContent.success, false);
  await deleteSourceDocument(source.id);
});

test("SSRF protection rejects private and internal IP URLs in content schemas", () => {
  const base = {
    title: "SSRF Test Entry",
    slug: "ssrf-test-entry",
    summary: "A valid summary for testing SSRF URL blocking.",
    category: categories[1],
    publisher: "Signal Research Desk",
    readingMinutes: 6,
    status: "draft",
    abstract: "This synthetic record tests that private/internal IP URLs are rejected by input validation.",
    takeaways: ["Private IPs are blocked."],
  };
  for (const blockedUrl of [
    "http://127.0.0.1/secret",
    "http://10.0.0.1/internal",
    "http://172.16.0.1/admin",
    "http://192.168.1.1/router",
    "http://169.254.169.254/latest/meta-data/",
    "http://0.0.0.0/",
    "http://localhost/secret",
  ]) {
    assert.equal(
      paperInputSchema.safeParse({ ...base, sourceUrl: blockedUrl }).success,
      false,
      `${blockedUrl} should be rejected as SSRF risk`,
    );
  }
  assert.equal(paperInputSchema.safeParse({ ...base, sourceUrl: "https://example.com/report.pdf" }).success, true);
  assert.equal(paperInputSchema.safeParse({ ...base, sourceUrl: "" }).success, true);
});

test("kill switches block AI generation, publishing, and ingest when enabled", () => {
  assert.doesNotThrow(() => assertKillSwitchOff("ai"));
  assert.doesNotThrow(() => assertKillSwitchOff("publish"));
  assert.doesNotThrow(() => assertKillSwitchOff("ingest"));

  process.env.KILL_AI_GENERATION = "true";
  assert.throws(() => assertKillSwitchOff("ai"), KillSwitchError);
  assert.doesNotThrow(() => assertKillSwitchOff("publish"));
  delete process.env.KILL_AI_GENERATION;

  process.env.KILL_PUBLISHING = "true";
  assert.throws(() => assertKillSwitchOff("publish"), KillSwitchError);
  delete process.env.KILL_PUBLISHING;

  process.env.KILL_INGEST = "true";
  assert.throws(() => assertKillSwitchOff("ingest"), KillSwitchError);
  delete process.env.KILL_INGEST;
});

test("audit events include correlation_id and detail columns", async () => {
  const events = await listLocalAuditEvents(1);
  if (events.length > 0) {
    const event = events[0];
    assert.equal(typeof event.correlationId, "string");
    assert.equal(typeof event.detail, "string");
  }
});
