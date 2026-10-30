"use client";

import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { showToast } from "@/lib/toast-utils";
import { HtmlEditor } from "@/components/html-editor";
import type { PaperRecord } from "@/lib/db";

interface ContentEditPageClientProps {
  siteId: number;
  contentId: number;
  paper: PaperRecord;
}

function paperToForm(p: PaperRecord) {
  return {
    title: p.title,
    subtitle: p.subtitle || "",
    slug: p.slug,
    summary: p.summary,
    status: p.status,
    editorialStatus: p.editorialStatus,
    content: p.abstract || "",
    tags: (p.tags || []).join(", "),
    updatedAt: p.updatedAt?.split("T")[0] || "",
    authorName: p.authorName || "",
    authorTitle: p.authorTitle || "",
    documentType: p.documentType || "whitepaper",
    language: p.language || "en",
    industry: p.industry || "",
    targetAudience: p.targetAudience || "",
    geographicTarget: p.geographicTarget || "",
    publicationDate: p.publicationDate || "",
    seoTitle: p.seoTitle || "",
    seoDescription: p.seoDescription || "",
    seoKeywords: (p.seoKeywords || []).join(", "),
    canonicalUrl: p.canonicalUrl || "",
    coverImageUrl: p.coverImageUrl || "",
    coverImageAlt: p.coverImageAlt || "",
    featured: p.featured || false,
    sourceName: p.sourceName || "",
    sourceUrl: p.sourceUrl || "",
    sourceDocumentUrl: p.sourceDocumentUrl || "",
    sourceDocumentTitle: p.sourceDocumentTitle || "",
    sourceRightsStatus: p.sourceRightsStatus || "unknown",
    sourceRightsEvidence: p.sourceRightsEvidence || "",
    geoSummary: p.geoSummary || "",
    keyEntities: (p.keyEntities || []).join(", "),
    keyFacts: (p.keyFacts || []).join("\n"),
    faqQ1: p.faqItems?.[0]?.question || "",
    faqA1: p.faqItems?.[0]?.answer || "",
    faqQ2: p.faqItems?.[1]?.question || "",
    faqA2: p.faqItems?.[1]?.answer || "",
    scheduledAt: p.scheduledAt || "",
  };
}

type Section = "basic" | "content" | "author" | "classification" | "seo" | "media" | "source" | "enrichment" | "status";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "basic", label: "Basic Info", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
  { id: "content", label: "Content", icon: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" },
  { id: "author", label: "Author", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" },
  { id: "classification", label: "Classification", icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" },
  { id: "seo", label: "SEO & Meta", icon: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" },
  { id: "media", label: "Media", icon: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" },
  { id: "source", label: "Source & Rights", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { id: "enrichment", label: "Enrichment", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  { id: "status", label: "Status", icon: "M9 11l3 3L22 4" },
];

export function ContentEditPageClient({ siteId, contentId, paper }: ContentEditPageClientProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("basic");
  const [form, setForm] = useState(() => paperToForm(paper));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.set("siteId", String(siteId));
      fd.set("title", form.title);
      fd.set("slug", form.slug);
      fd.set("summary", form.summary);
      fd.set("subtitle", form.subtitle);
      fd.set("status", form.status);
      fd.set("abstract", form.content);
      fd.set("category", paper.category || "General");
      fd.set("publisher", paper.publisher || "Signal Research");
      fd.set("readingMinutes", String(paper.readingMinutes || 5));
      fd.set("takeaways", (paper.takeaways || ["Key insight"]).join("\n"));
      fd.set("tags", form.tags.split(",").map((t: string) => t.trim()).filter(Boolean).join("\n"));
      fd.set("authorName", form.authorName);
      fd.set("authorTitle", form.authorTitle);
      fd.set("documentType", form.documentType);
      fd.set("language", form.language);
      fd.set("publicationDate", form.publicationDate);
      fd.set("industry", form.industry);
      fd.set("targetAudience", form.targetAudience);
      fd.set("geographicTarget", form.geographicTarget);
      fd.set("seoTitle", form.seoTitle);
      fd.set("seoDescription", form.seoDescription);
      fd.set("seoKeywords", form.seoKeywords.split(",").map((k: string) => k.trim()).filter(Boolean).join("\n"));
      fd.set("canonicalUrl", form.canonicalUrl);
      fd.set("coverImageAlt", form.coverImageAlt);
      if (form.featured) fd.set("featured", "on");
      fd.set("sourceName", form.sourceName);
      fd.set("sourceUrl", form.sourceUrl);
      fd.set("sourceDocumentUrl", form.sourceDocumentUrl);
      fd.set("sourceDocumentTitle", form.sourceDocumentTitle);
      fd.set("sourceRightsStatus", form.sourceRightsStatus);
      fd.set("sourceRightsEvidence", form.sourceRightsEvidence);
      fd.set("geoSummary", form.geoSummary);
      fd.set("keyEntities", form.keyEntities.split(",").map((e: string) => e.trim()).filter(Boolean).join("\n"));
      fd.set("keyFacts", form.keyFacts.split("\n").map((f: string) => f.trim()).filter(Boolean).join("\n"));
      const faqLines: string[] = [];
      if (form.faqQ1 && form.faqA1) faqLines.push(`${form.faqQ1}|||${form.faqA1}`);
      if (form.faqQ2 && form.faqA2) faqLines.push(`${form.faqQ2}|||${form.faqA2}`);
      fd.set("faqItems", faqLines.join("\n"));
      fd.set("scheduledAt", form.scheduledAt);

      const res = await fetch(`/api/admin/content/${contentId}`, {
        method: "POST",
        body: fd,
        redirect: "manual",
      });
      // API returns 303 redirect on success
      if (res.status === 0 || res.type === "opaqueredirect" || res.ok || (res.status >= 300 && res.status < 400)) {
        showToast.siteSaved();
        return;
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Save failed (${res.status})`);
    } catch (error) {
      showToast.saveFailed(error instanceof Error ? error.message : undefined);
    } finally {
      setIsSaving(false);
    }
  }

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="admin-breadcrumb" aria-label="Breadcrumb">
        <Link href="/admin">Control room</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/sites">Sites</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/admin/sites/${siteId}`}>Site</Link>
        <span aria-hidden="true">/</span>
        <span>Edit content</span>
      </nav>

      <div className="detail-header" style={{ marginBottom: "16px" }}>
        <div>
          <h1 style={{ margin: 0 }}>{form.title}</h1>
          <p className="text-muted" style={{ margin: "4px 0 0" }}>
            ID: {contentId} &middot; {form.editorialStatus.replace("_", " ")} &middot; Updated {form.updatedAt}
          </p>
        </div>
        <Link href={`/admin/sites/${siteId}`} className="btn">Back to site</Link>
      </div>

      {/* Section Tabs */}
      <div className="settings-tabs" style={{ marginBottom: "0" }}>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`settings-tab ${activeSection === s.id ? "active" : ""}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={s.icon} />
            </svg>
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="content-edit-form">

        {/* ── Basic Info ── */}
        {activeSection === "basic" && (
          <div className="settings-panel">
            <div className="form-section-title">
              <h2>Basic Information</h2>
              <p>Title, slug, summary, and tags.</p>
            </div>
            <div className="form-grid-modern">
              <div className="form-field span-2">
                <label htmlFor="f-title">Title</label>
                <input id="f-title" value={form.title} onChange={(e) => set("title", e.target.value)} required maxLength={200} />
              </div>
              <div className="form-field span-2">
                <label htmlFor="f-subtitle">Subtitle</label>
                <input id="f-subtitle" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={300} />
              </div>
              <div className="form-field">
                <label htmlFor="f-slug">Slug</label>
                <input id="f-slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} required maxLength={200} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
                <span className="form-hint">URL-friendly identifier (lowercase, hyphens only)</span>
              </div>
              <div className="form-field">
                <label htmlFor="f-tags">Tags</label>
                <input id="f-tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Comma-separated tags" maxLength={500} />
              </div>
              <div className="form-field span-2">
                <label htmlFor="f-summary">Summary</label>
                <textarea id="f-summary" value={form.summary} onChange={(e) => set("summary", e.target.value)} maxLength={500} rows={3} />
                <span className="form-hint">{form.summary.length}/500 characters</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Content Editor ── */}
        {activeSection === "content" && (
          <div className="settings-panel">
            <div className="form-section-title">
              <h2>Content Body</h2>
              <p>Rich text editor with formatting toolbar. Switch to code view for raw HTML.</p>
            </div>
            <div className="form-field">
              <HtmlEditor
                value={form.content}
                onChange={(html) => set("content", html)}
                minHeight={420}
                placeholder="Start writing your content..."
              />
            </div>
          </div>
        )}

        {/* ── Author ── */}
        {activeSection === "author" && (
          <div className="settings-panel">
            <div className="form-section-title">
              <h2>Author Details</h2>
              <p>Attribution information for the content creator.</p>
            </div>
            <div className="form-grid-modern">
              <div className="form-field">
                <label htmlFor="f-authorName">Author name</label>
                <input id="f-authorName" value={form.authorName} onChange={(e) => set("authorName", e.target.value)} maxLength={120} />
              </div>
              <div className="form-field">
                <label htmlFor="f-authorTitle">Author title / role</label>
                <input id="f-authorTitle" value={form.authorTitle} onChange={(e) => set("authorTitle", e.target.value)} maxLength={160} />
              </div>
            </div>
          </div>
        )}

        {/* ── Classification ── */}
        {activeSection === "classification" && (
          <div className="settings-panel">
            <div className="form-section-title">
              <h2>Classification & Taxonomy</h2>
              <p>Document type, industry, audience, and geographic targeting.</p>
            </div>
            <div className="form-grid-modern">
              <div className="form-field">
                <label htmlFor="f-documentType">Document type</label>
                <select id="f-documentType" value={form.documentType} onChange={(e) => set("documentType", e.target.value)}>
                  <option value="whitepaper">Whitepaper</option>
                  <option value="research_report">Research Report</option>
                  <option value="case_study">Case Study</option>
                  <option value="guide">Guide</option>
                  <option value="briefing">Briefing</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="f-language">Language</label>
                <select id="f-language" value={form.language} onChange={(e) => set("language", e.target.value)}>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="ar">Arabic</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="f-industry">Industry / vertical</label>
                <input id="f-industry" value={form.industry} onChange={(e) => set("industry", e.target.value)} maxLength={100} placeholder="e.g. Technology, Healthcare, Finance" />
              </div>
              <div className="form-field">
                <label htmlFor="f-targetAudience">Target audience</label>
                <input id="f-targetAudience" value={form.targetAudience} onChange={(e) => set("targetAudience", e.target.value)} maxLength={200} placeholder="e.g. CTOs, Data Scientists" />
              </div>
              <div className="form-field">
                <label htmlFor="f-geographicTarget">Geographic target</label>
                <input id="f-geographicTarget" value={form.geographicTarget} onChange={(e) => set("geographicTarget", e.target.value)} maxLength={100} placeholder="e.g. Global, North America, EMEA" />
              </div>
              <div className="form-field">
                <label htmlFor="f-publicationDate">Publication date</label>
                <input id="f-publicationDate" type="date" value={form.publicationDate} onChange={(e) => set("publicationDate", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── SEO & Meta ── */}
        {activeSection === "seo" && (
          <div className="settings-panel">
            <div className="form-section-title">
              <h2>SEO & Metadata</h2>
              <p>Search engine optimization, Open Graph, and structured data fields.</p>
            </div>
            <div className="form-grid-modern">
              <div className="form-field span-2">
                <label htmlFor="f-seoTitle">SEO title</label>
                <input id="f-seoTitle" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={70} />
                <span className="form-hint">{form.seoTitle.length}/70 characters — recommended under 60</span>
              </div>
              <div className="form-field span-2">
                <label htmlFor="f-seoDescription">Meta description</label>
                <textarea id="f-seoDescription" value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={160} rows={2} />
                <span className="form-hint">{form.seoDescription.length}/160 characters — recommended under 155</span>
              </div>
              <div className="form-field span-2">
                <label htmlFor="f-seoKeywords">SEO keywords</label>
                <input id="f-seoKeywords" value={form.seoKeywords} onChange={(e) => set("seoKeywords", e.target.value)} maxLength={500} placeholder="Comma-separated keywords" />
                <span className="form-hint">Used for internal search and keyword analysis</span>
              </div>
              <div className="form-field span-2">
                <label htmlFor="f-canonicalUrl">Canonical URL</label>
                <input id="f-canonicalUrl" value={form.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} type="url" maxLength={2048} placeholder="https://..." />
                <span className="form-hint">Leave blank to auto-generate from slug</span>
              </div>
            </div>

            {/* SEO Preview */}
            <div className="seo-preview">
              <span className="seo-preview-label">Search preview</span>
              <div className="seo-preview-title">{form.seoTitle || form.title}</div>
              <div className="seo-preview-url">{form.canonicalUrl || `https://example.com/whitepapers/${form.slug}/`}</div>
              <div className="seo-preview-desc">{form.seoDescription || form.summary}</div>
            </div>
          </div>
        )}

        {/* ── Media ── */}
        {activeSection === "media" && (
          <MediaSection form={form} set={set} />
        )}

        {/* ── Source & Rights ── */}
        {activeSection === "source" && (
          <div className="settings-panel">
            <div className="form-section-title">
              <h2>Source & Rights</h2>
              <p>Attribution, provenance, and rights clearance for publishing.</p>
            </div>
            <div className="form-grid-modern">
              <div className="form-field">
                <label htmlFor="f-sourceName">Source name</label>
                <input id="f-sourceName" value={form.sourceName} onChange={(e) => set("sourceName", e.target.value)} maxLength={200} />
              </div>
              <div className="form-field">
                <label htmlFor="f-sourceUrl">Source URL</label>
                <input id="f-sourceUrl" value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} type="url" maxLength={2048} />
              </div>
              <div className="form-field">
                <label htmlFor="f-sourceDocumentUrl">Source document URL</label>
                <input id="f-sourceDocumentUrl" value={form.sourceDocumentUrl} onChange={(e) => set("sourceDocumentUrl", e.target.value)} type="url" maxLength={2048} />
              </div>
              <div className="form-field">
                <label htmlFor="f-sourceDocumentTitle">Source document title</label>
                <input id="f-sourceDocumentTitle" value={form.sourceDocumentTitle} onChange={(e) => set("sourceDocumentTitle", e.target.value)} maxLength={300} />
              </div>

              <div className="form-divider span-2" />

              <div className="form-field">
                <label htmlFor="f-sourceRightsStatus">Rights status</label>
                <select id="f-sourceRightsStatus" value={form.sourceRightsStatus} onChange={(e) => set("sourceRightsStatus", e.target.value)}>
                  <option value="unknown">Unknown</option>
                  <option value="allowed">Allowed</option>
                  <option value="review_required">Review Required</option>
                  <option value="blocked">Blocked</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="form-field">
                <label>&nbsp;</label>
                <span className={`badge ${form.sourceRightsStatus === "allowed" ? "badge-success" : form.sourceRightsStatus === "blocked" || form.sourceRightsStatus === "expired" ? "badge-danger" : "badge-warning"}`} style={{ alignSelf: "center", fontSize: "12px", padding: "4px 12px" }}>
                  {form.sourceRightsStatus.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className="form-field span-2">
                <label htmlFor="f-sourceRightsEvidence">Rights evidence</label>
                <textarea id="f-sourceRightsEvidence" value={form.sourceRightsEvidence} onChange={(e) => set("sourceRightsEvidence", e.target.value)} maxLength={2000} rows={3} placeholder="Explain how rights were obtained (min 20 chars for publishing)" />
                <span className="form-hint">{form.sourceRightsEvidence.length} characters — minimum 20 required for publishing</span>
              </div>
            </div>
            {form.sourceRightsStatus !== "allowed" && (
              <div className="info-banner" style={{ marginTop: "16px", background: "rgba(198, 40, 40, 0.06)", color: "var(--error)" }}>
                Content cannot be published until rights status is set to <strong>Allowed</strong> with sufficient evidence.
              </div>
            )}
          </div>
        )}

        {/* ── Enrichment ── */}
        {activeSection === "enrichment" && (
          <div className="settings-panel">
            <div className="form-section-title">
              <h2>Content Enrichment</h2>
              <p>Key entities, facts, FAQ, and geographic summary for AI and structured data.</p>
            </div>
            <div className="form-grid-modern">
              <div className="form-field span-2">
                <label htmlFor="f-keyEntities">Key entities</label>
                <input id="f-keyEntities" value={form.keyEntities} onChange={(e) => set("keyEntities", e.target.value)} maxLength={500} placeholder="Comma-separated key entities mentioned" />
                <span className="form-hint">Used for knowledge graph and related content</span>
              </div>
              <div className="form-field span-2">
                <label htmlFor="f-keyFacts">Key facts</label>
                <textarea id="f-keyFacts" value={form.keyFacts} onChange={(e) => set("keyFacts", e.target.value)} maxLength={2000} rows={3} placeholder="One fact per line" />
                <span className="form-hint">Extracted facts used for structured data and citations</span>
              </div>
              <div className="form-field span-2">
                <label htmlFor="f-geoSummary">Geographic summary</label>
                <textarea id="f-geoSummary" value={form.geoSummary} onChange={(e) => set("geoSummary", e.target.value)} maxLength={1000} rows={2} placeholder="Geographic context or regional relevance" />
              </div>

              <div className="form-divider span-2" />

              <div className="form-section-title span-2" style={{ marginBottom: "8px", marginTop: "8px" }}>
                <h3 style={{ fontSize: "15px", margin: 0 }}>FAQ Items</h3>
                <p>Frequently asked questions — used for FAQ schema markup.</p>
              </div>

              <div className="form-field">
                <label htmlFor="f-faqQ1">Question 1</label>
                <input id="f-faqQ1" value={form.faqQ1} onChange={(e) => set("faqQ1", e.target.value)} maxLength={300} />
              </div>
              <div className="form-field">
                <label htmlFor="f-faqA1">Answer 1</label>
                <input id="f-faqA1" value={form.faqA1} onChange={(e) => set("faqA1", e.target.value)} maxLength={1000} />
              </div>
              <div className="form-field">
                <label htmlFor="f-faqQ2">Question 2</label>
                <input id="f-faqQ2" value={form.faqQ2} onChange={(e) => set("faqQ2", e.target.value)} maxLength={300} />
              </div>
              <div className="form-field">
                <label htmlFor="f-faqA2">Answer 2</label>
                <input id="f-faqA2" value={form.faqA2} onChange={(e) => set("faqA2", e.target.value)} maxLength={1000} />
              </div>
            </div>
          </div>
        )}

        {/* ── Status & Workflow ── */}
        {activeSection === "status" && (
          <div className="settings-panel">
            <div className="form-section-title">
              <h2>Status & Workflow</h2>
              <p>Publication status, editorial review, and scheduling.</p>
            </div>
            <div className="form-grid-modern">
              <div className="form-field">
                <label htmlFor="f-status">Publication status</label>
                <select id="f-status" value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="f-editorialStatus">Editorial status</label>
                <select id="f-editorialStatus" value={form.editorialStatus} onChange={(e) => set("editorialStatus", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="changes_requested">Changes Requested</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="f-scheduledAt">Scheduled publish date</label>
                <input id="f-scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} />
                <span className="form-hint">Only used when status is "Scheduled"</span>
              </div>
              <div className="form-field">
                <label>Current state</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", paddingTop: "6px" }}>
                  <span className={`badge ${form.status === "published" ? "badge-success" : form.status === "draft" ? "badge-warning" : form.status === "scheduled" ? "badge-info" : "badge-muted"}`}>
                    {form.status}
                  </span>
                  <span className={`badge ${form.editorialStatus === "approved" ? "badge-success" : form.editorialStatus === "in_review" ? "badge-warning" : form.editorialStatus === "changes_requested" ? "badge-danger" : "badge-muted"}`}>
                    {form.editorialStatus.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
            <div className="info-banner" style={{ marginTop: "16px" }}>
              Content must be <strong>approved</strong> + <strong>published</strong> + rights <strong>allowed</strong> (with 20+ char evidence) to be visible publicly.
            </div>
          </div>
        )}

        {/* Sticky Footer Actions */}
        <div className="form-actions-bar">
          <Link href={`/admin/sites/${siteId}`} className="btn">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </>
  );
}

/* ── Media Section with Upload ── */

function MediaSection({ form, set }: { form: any; set: (f: string, v: string | boolean) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      showToast.saveFailed("Only image files (JPEG, PNG, WebP) are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast.saveFailed("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        set("coverImageUrl", data.url);
        showToast.siteSaved();
      } else {
        showToast.saveFailed(data.error || "Upload failed");
      }
    } catch {
      showToast.saveFailed("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="settings-panel">
      <div className="form-section-title">
        <h2>Cover Image & Media</h2>
        <p>Upload or link a featured image. Accepts JPEG, PNG, WebP up to 5 MB.</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragOver ? "upload-zone-active" : ""} ${uploading ? "upload-zone-uploading" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        {uploading ? (
          <div className="upload-zone-content">
            <div className="upload-spinner" />
            <span>Uploading...</span>
          </div>
        ) : form.coverImageUrl ? (
          <div className="upload-zone-preview">
            <img src={form.coverImageUrl} alt={form.coverImageAlt || "Cover"} />
            <div className="upload-zone-overlay">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Click or drop to replace</span>
            </div>
          </div>
        ) : (
          <div className="upload-zone-content">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span><strong>Click to upload</strong> or drag and drop</span>
            <span className="text-muted text-xs">JPEG, PNG, or WebP up to 5 MB</span>
          </div>
        )}
      </div>

      {/* Manual URL + Alt + Options */}
      <div className="form-grid-modern" style={{ marginTop: "16px" }}>
        <div className="form-field span-2">
          <label htmlFor="f-coverImageUrl">Image URL</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="f-coverImageUrl"
              value={form.coverImageUrl}
              onChange={(e) => set("coverImageUrl", e.target.value)}
              type="text"
              maxLength={2048}
              placeholder="Image URL or upload above"
              style={{ flex: 1 }}
            />
            {form.coverImageUrl && (
              <button
                type="button"
                className="btn btn-danger-outline btn-sm"
                onClick={() => set("coverImageUrl", "")}
              >
                Remove
              </button>
            )}
          </div>
        </div>
        <div className="form-field span-2">
          <label htmlFor="f-coverImageAlt">Alt text</label>
          <input id="f-coverImageAlt" value={form.coverImageAlt} onChange={(e) => set("coverImageAlt", e.target.value)} maxLength={300} placeholder="Descriptive alt text for accessibility and SEO" />
          <span className="form-hint">Required for accessibility (WCAG) and helps with image SEO</span>
        </div>
        <div className="form-field span-2">
          <label className="toggle-label">
            <input type="checkbox" checked={form.featured} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("featured", e.target.checked)} className="toggle-input" />
            <span className="toggle-switch" />
            <span>Featured content — highlight on homepage and catalog</span>
          </label>
        </div>
      </div>
    </div>
  );
}
