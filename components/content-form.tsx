"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { PaperInput, SiteRecord } from "@/lib/db";

export function ContentForm({
  action,
  submitLabel,
  values,
  sites,
  editorialStatus = "draft",
}: {
  action: string;
  submitLabel: string;
  values?: PaperInput;
  sites: SiteRecord[];
  editorialStatus?: "draft" | "in_review" | "approved" | "changes_requested";
}) {
  const scheduleLocalRef = useRef<HTMLInputElement>(null);
  const scheduleIsoRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (values?.scheduledAt && scheduleLocalRef.current) {
      const date = new Date(values.scheduledAt);
      if (!Number.isNaN(date.getTime())) {
        const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
        scheduleLocalRef.current.value = localTime;
      }
    }
  }, [values?.scheduledAt]);

  return (
    <form
      action={action}
      className="admin-form admin-editor-form content-editor-form"
      encType="multipart/form-data"
      method="post"
      onSubmit={() => {
        const localValue = scheduleLocalRef.current?.value;
        if (scheduleIsoRef.current) {
          scheduleIsoRef.current.value = localValue ? new Date(localValue).toISOString() : "";
        }
      }}
    >
      <div className="editor-layout">
        <aside className="editor-rail">
          <div className="editor-rail-card">
            <p className="editor-rail-kicker">CONTENT STUDIO</p>
            <h2>Entry workspace</h2>
            <p>Build a complete research page. Your progress is saved when you submit.</p>
            <nav className="editor-section-nav" aria-label="Content form sections">
              <a href="#editor-content"><span>01</span> Editorial details</a>
              <a href="#editor-media"><span>02</span> Cover image</a>
              <a href="#editor-source"><span>03</span> Source &amp; rights</a>
              <a href="#editor-discovery"><span>04</span> SEO &amp; sharing</a>
              <a href="#editor-geo"><span>05</span> GEO &amp; answers</a>
            </nav>
            <div className="editor-rail-note">
              <strong>Editorial review required</strong>
              <p>Confirm source rights and submit this entry for review. Content edits reset prior approval; scheduling and publishing are available only after approval.</p>
            </div>
          </div>
        </aside>

        <div className="editor-form-content">
          <div className="editor-form-banner">
            <span className="editor-status-mark" aria-hidden="true">✦</span>
            <div><strong>{values ? "Keep your entry up to date" : "Start with the essentials"}</strong><p>Complete the sections you need, then review before saving.</p></div>
            <span className="editor-local-badge">LOCAL WORKSPACE</span>
          </div>

          <section className="editor-section" id="editor-content" aria-labelledby="editor-content-heading">
            <div className="editor-section-heading">
              <span className="editor-step">01</span>
              <div><h2 id="editor-content-heading">Editorial details</h2><p>Set the structure and core information readers will see.</p></div>
            </div>
            <div className="form-grid">
          <label>Title<input defaultValue={values?.title} maxLength={140} name="title" required /></label>
          <label>Subtitle / deck<input defaultValue={values?.subtitle} maxLength={180} name="subtitle" /></label>
          <label>URL slug<input defaultValue={values?.slug} maxLength={120} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
          <label>Target site
            <select defaultValue={values?.siteId ?? sites[0]?.id} name="siteId" required>
              {sites.map((site) => <option key={site.id} value={site.id}>{site.name} · {site.publicUrl ? new URL(site.publicUrl).hostname : "domain not configured"}</option>)}
            </select>
          </label>
          <label>Content type
            <select defaultValue={values?.documentType ?? "whitepaper"} name="documentType">
              <option value="whitepaper">Whitepaper</option>
              <option value="research_report">Research report</option>
              <option value="case_study">Case study</option>
              <option value="guide">Guide</option>
              <option value="briefing">Briefing</option>
            </select>
          </label>
          <label>Topic<input defaultValue={values?.category} maxLength={80} name="category" required /></label>
          <label>Industry<input defaultValue={values?.industry} maxLength={100} name="industry" /></label>
          <label>Publisher / organization<input defaultValue={values?.publisher ?? "Signal Research Desk"} maxLength={120} name="publisher" required /></label>
          <label>Author name<input defaultValue={values?.authorName ?? "Signal Research Desk"} maxLength={120} name="authorName" /></label>
          <label>Author role<input defaultValue={values?.authorTitle} maxLength={120} name="authorTitle" /></label>
          <label>Reading time (minutes)<input defaultValue={values?.readingMinutes ?? 10} max={600} min={1} name="readingMinutes" required type="number" /></label>
          <label>Language code<input defaultValue={values?.language ?? "en"} maxLength={12} name="language" pattern="[a-z]{2,3}(-[A-Z]{2})?" /></label>
          <label>Publication date<input defaultValue={values?.publicationDate} name="publicationDate" type="date" /></label>
          <label>Target audience<input defaultValue={values?.targetAudience} maxLength={180} name="targetAudience" /></label>
          <label>Geographic target<input defaultValue={values?.geographicTarget} maxLength={180} name="geographicTarget" placeholder="e.g. North America, United Kingdom" /></label>
          <label>Status
            <select defaultValue={values?.status ?? "draft"} name="status">
              <option value="draft">Draft</option>
              {editorialStatus === "approved" && <><option value="scheduled">Schedule publication</option><option value="published">Publish now</option></>}
              {values && <option value="archived">Archived</option>}
            </select>
          </label>
          <label>Publish at (your local time)<input ref={scheduleLocalRef} type="datetime-local" /></label>
          <input ref={scheduleIsoRef} name="scheduledAt" type="hidden" />
          <label className="form-wide">Summary / excerpt<textarea defaultValue={values?.summary} maxLength={500} name="summary" required rows={3} /></label>
          <label className="form-wide">Abstract<textarea defaultValue={values?.abstract} maxLength={2000} name="abstract" required rows={5} /></label>
          <label className="form-wide">Key takeaways <span className="label-hint">One per line; up to 8.</span><textarea defaultValue={values?.takeaways.join("\n")} maxLength={2400} name="takeaways" required rows={4} /></label>
          <label className="form-wide">Tags <span className="label-hint">One per line; up to 20.</span><textarea defaultValue={values?.tags.join("\n")} maxLength={1100} name="tags" rows={3} /></label>
          <label className="checkbox-label"><input defaultChecked={values?.featured ?? false} name="featured" type="checkbox" /> Feature this entry in the library</label>
        </div>
      </section>

      <section className="editor-section" id="editor-media" aria-labelledby="editor-media-heading">
        <div className="editor-section-heading">
          <span className="editor-step">02</span>
          <div><h2 id="editor-media-heading">Cover image</h2><p>Make your entry stand out in the library and on its detail page.</p></div>
        </div>
        <div className="form-grid">
          <label className="form-wide">Upload or replace cover image <span className="label-hint">JPEG, PNG, or WebP up to 5 MB. SVG and other active formats are rejected.</span><input accept="image/jpeg,image/png,image/webp" name="coverImage" type="file" /></label>
          {values?.coverImageUrl && (
            <div className="form-wide cover-image-current">
              <img alt={values.coverImageAlt || ""} height="180" src={values.coverImageUrl} />
              <span>Current cover image</span>
              <label className="checkbox-label"><input name="removeCoverImage" type="checkbox" /> Remove current image</label>
            </div>
          )}
          <label className="form-wide">Image alt text<input defaultValue={values?.coverImageAlt} maxLength={180} name="coverImageAlt" placeholder="Describe the image for screen-reader users" /></label>
        </div>
      </section>

      <section className="editor-section" id="editor-source" aria-labelledby="editor-source-heading">
        <div className="editor-section-heading">
          <span className="editor-step">03</span>
          <div><h2 id="editor-source-heading">Source &amp; rights</h2><p>Keep source material private and document the rights basis.</p></div>
        </div>
        <div className="form-grid">
          <label className="form-wide">Upload source PDF <span className="label-hint">PDF only, up to 20 MB. Files are private and are not scanned or extracted in this prototype.</span><input accept="application/pdf,.pdf" name="sourcePdf" type="file" /></label>
          {values?.sourceDocumentAsset && (
            <div className="form-wide current-source-document">
              <a href={values.sourceDocumentAsset}>Download current source PDF (admin only)</a>
              <label className="checkbox-label"><input name="removeSourceDocument" type="checkbox" /> Remove current source PDF</label>
            </div>
          )}
          <label className="form-wide">Reader download PDF <span className="label-hint">Separate approved reader file, up to 20 MB. Never use the private source PDF here.</span><input accept="application/pdf,.pdf" name="downloadPdf" type="file" /></label>
          {values?.downloadablePdfAsset && <div className="form-wide current-source-document"><a href={values.downloadablePdfAsset}>Download current reader PDF (admin only)</a><label className="checkbox-label"><input name="removeDownloadPdf" type="checkbox" /> Remove reader PDF</label></div>}
          <label className="form-wide">External PDF/source URL <span className="label-hint">Must be HTTP(S). The application does not download or validate external links.</span><input defaultValue={values?.sourceDocumentUrl} maxLength={2048} name="sourceDocumentUrl" type="url" /></label>
          <label className="form-wide">Source document title<input defaultValue={values?.sourceDocumentTitle} maxLength={240} name="sourceDocumentTitle" /></label>
          <label className="form-wide">Attribution publisher<input defaultValue={values?.sourceName} maxLength={160} name="sourceName" /></label>
          <label className="form-wide">Attribution URL<input defaultValue={values?.sourceUrl} maxLength={2048} name="sourceUrl" type="url" /></label>
          <label>Rights status
            <select defaultValue={values?.sourceRightsStatus ?? "unknown"} name="sourceRightsStatus">
              <option value="unknown">Unknown — blocked from publishing</option>
              <option value="review_required">Review required</option>
              <option value="allowed">Allowed — evidence required</option>
              <option value="blocked">Blocked</option>
              <option value="expired">Expired</option>
            </select>
          </label>
          <label className="form-wide">Rights evidence / permission basis <span className="label-hint">Required to publish or schedule: record the license, ownership, permission, and/or approval reference.</span><textarea defaultValue={values?.sourceRightsEvidence} maxLength={2000} name="sourceRightsEvidence" rows={4} /></label>
        </div>
      </section>

      <section className="editor-section" id="editor-discovery" aria-labelledby="editor-discovery-heading">
        <div className="editor-section-heading">
          <span className="editor-step">04</span>
          <div><h2 id="editor-discovery-heading">SEO &amp; sharing</h2><p>Control how this entry is described when shared. Indexing remains disabled in this prototype.</p></div>
        </div>
        <div className="form-grid">
          <label className="form-wide">SEO title <span className="label-hint">Recommended maximum: 60 characters.</span><input defaultValue={values?.seoTitle} maxLength={70} name="seoTitle" /></label>
          <label className="form-wide">SEO description <span className="label-hint">Recommended maximum: 160 characters.</span><textarea defaultValue={values?.seoDescription} maxLength={180} name="seoDescription" rows={3} /></label>
          <label className="form-wide">Canonical URL <span className="label-hint">Optional absolute HTTP(S) URL. Leave blank to use the site route.</span><input defaultValue={values?.canonicalUrl} maxLength={2048} name="canonicalUrl" type="url" /></label>
          <label className="form-wide">SEO keywords <span className="label-hint">One per line; up to 20.</span><textarea defaultValue={values?.seoKeywords.join("\n")} maxLength={1300} name="seoKeywords" rows={3} /></label>
        </div>
      </section>

      <section className="editor-section" id="editor-geo" aria-labelledby="editor-geo-heading">
        <div className="editor-section-heading">
          <span className="editor-step">05</span>
          <div><h2 id="editor-geo-heading">GEO &amp; answer readiness</h2><p>Give answer engines concise, attributable context without making unsupported claims.</p></div>
        </div>
        <div className="form-grid">
          <label className="form-wide">Concise answer / GEO summary<textarea defaultValue={values?.geoSummary} maxLength={1200} name="geoSummary" rows={4} /></label>
          <label className="form-wide">Key entities <span className="label-hint">One named organization, product, person, or concept per line; up to 20.</span><textarea defaultValue={values?.keyEntities.join("\n")} maxLength={2100} name="keyEntities" rows={4} /></label>
          <label className="form-wide">Verifiable facts <span className="label-hint">One sourced, specific fact per line; up to 12. Avoid unsupported claims.</span><textarea defaultValue={values?.keyFacts.join("\n")} maxLength={5000} name="keyFacts" rows={5} /></label>
          <label className="form-wide">Frequently asked questions <span className="label-hint">One per line, formatted: Question ||| Answer. Up to 10.</span><textarea defaultValue={values?.faqItems.map((item) => `${item.question} ||| ${item.answer}`).join("\n")} maxLength={11000} name="faqItems" rows={6} /></label>
        </div>
      </section>

          <div className="form-actions"><Link className="admin-text-link" href="/admin/content">Cancel</Link><button className="button button-dark" type="submit">{submitLabel} <span aria-hidden="true">↗</span></button></div>
        </div>
      </div>
    </form>
  );
}
