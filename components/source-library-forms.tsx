"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { SourceDocumentRecord, SiteRecord } from "@/lib/db";

function localDateTime(value: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function useScheduleSubmit() {
  const localRef = useRef<HTMLInputElement>(null);
  const isoRef = useRef<HTMLInputElement>(null);
  const onSubmit = () => {
    const local = localRef.current?.value;
    if (isoRef.current) isoRef.current.value = local ? new Date(local).toISOString() : "";
  };
  return { localRef, isoRef, onSubmit };
}

function TargetSitePicker({
  sites,
  initialSelected,
  name,
  legend,
  className = "",
  showDraftLabel = false,
}: {
  sites: SiteRecord[];
  initialSelected: string[];
  name: string;
  legend: string;
  className?: string;
  showDraftLabel?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState(() => new Set(initialSelected));
  const visibleSites = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return sites.filter((site) => !normalizedSearch
      || site.name.toLowerCase().includes(normalizedSearch)
      || site.slug.toLowerCase().includes(normalizedSearch)
      || site.publicUrl.toLowerCase().includes(normalizedSearch));
  }, [search, sites]);
  const selectedSites = sites.filter((site) => selectedSlugs.has(site.slug));
  const selectedSummary = selectedSites.slice(0, 3).map((site) => site.name);
  const remainingSelected = selectedSites.length - selectedSummary.length;

  return (
    <fieldset className={`source-site-targets ${className}`}>
      <legend>{legend}</legend>
      {selectedSites.map((site) => <input key={site.slug} name={name} type="hidden" value={site.slug} />)}
      <div className="source-site-picker-summary">
        <strong>{selectedSites.length} of {sites.length} selected</strong>
        {selectedSummary.length > 0 && <span>{selectedSummary.join(", ")}{remainingSelected > 0 ? ` +${remainingSelected} more` : ""}</span>}
        {selectedSites.length === 0 && <span>Select at least one site to generate drafts.</span>}
      </div>
      <div className="source-site-picker-toolbar">
        <label className="source-site-search">
          <span className="visually-hidden">Search target sites</span>
          <input
            autoComplete="off"
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search sites by name or domain"
            type="search"
            value={search}
          />
        </label>
        <button className="source-site-action" disabled={selectedSites.length === sites.length} onClick={() => setSelectedSlugs(new Set(sites.map((site) => site.slug)))} type="button">
          Select all {sites.length}
        </button>
        <button className="source-site-action" disabled={selectedSites.length === 0} onClick={() => setSelectedSlugs(new Set())} type="button">
          Clear
        </button>
      </div>
      {visibleSites.length > 0 ? (
        <div className="source-site-picker-options">
          {visibleSites.map((site) => (
            <label className="source-site-option" key={site.slug}>
              <input
                checked={selectedSlugs.has(site.slug)}
                onChange={(event) => setSelectedSlugs((current) => {
                  const next = new Set(current);
                  if (event.currentTarget.checked) next.add(site.slug);
                  else next.delete(site.slug);
                  return next;
                })}
                type="checkbox"
              />
              <span><strong>{site.name}</strong><small>{site.publicUrl ? new URL(site.publicUrl).hostname : "Domain not configured"} · /{site.slug}</small></span>
              {showDraftLabel && <span className="source-site-draft">Draft output</span>}
            </label>
          ))}
        </div>
      ) : (
        <p className="source-site-no-results" role="status">No sites match “{search}”.</p>
      )}
    </fieldset>
  );
}

export function BulkSourceIntake({ sites, reservedDates }: { sites: SiteRecord[]; reservedDates: string[] }) {
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [scheduleValues, setScheduleValues] = useState<string[]>([]);
  const [scheduleError, setScheduleError] = useState("");
  const reservedDateSet = new Set(reservedDates);
  const sourceItems = [
    ...files.map((file, index) => ({ key: `pdf-${index}-${file.name}`, label: file.name, kind: "PDF" })),
    ...urls.map((url, index) => {
      try {
        return { key: `url-${index}-${url}`, label: new URL(url).hostname, kind: "URL" };
      } catch {
        return { key: `url-${index}-${url}`, label: url, kind: "URL" };
      }
    }),
  ];
  const updateItemCount = (nextFiles: File[], nextUrls: string[]) => {
    setScheduleValues(Array(nextFiles.length + nextUrls.length).fill(""));
    setScheduleError("");
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const dates = scheduleValues.slice(0, sourceItems.length).map((value) => value.slice(0, 10));
    if (dates.length !== sourceItems.length || dates.some((date) => !date) || new Set(dates).size !== dates.length) {
      event.preventDefault();
      setScheduleError("Every PDF and link must have its own schedule. Use a different calendar date for each item.");
      return;
    }
    const utcDates = scheduleValues.slice(0, sourceItems.length).map((value) => new Date(value).toISOString().slice(0, 10));
    if (new Set(utcDates).size !== utcDates.length || utcDates.some((date) => reservedDateSet.has(date))) {
      event.preventDefault();
      setScheduleError("A calendar date can be assigned to only one source across the library. Choose unused dates.");
      return;
    }
    setScheduleError("");
  };
  return (
    <form
      action="/api/admin/source-documents"
      className="source-intake-form"
      encType="multipart/form-data"
      method="post"
      onSubmit={handleSubmit}
    >
      <div className="source-intake-heading">
        <span className="source-intake-icon" aria-hidden="true">↥</span>
        <div><h2>Add source documents</h2><p>Upload PDFs and paste external PDF links in one batch. Assign a different schedule date to every item.</p></div>
        <span className="source-limit">20 sources / batch</span>
      </div>
      <div className="source-intake-grid">
        <label className="source-upload-drop">
          <span className="source-upload-symbol" aria-hidden="true">＋</span>
          <strong>Select PDF files</strong>
          <small>Choose multiple PDFs · up to 20 MB each</small>
          <input accept="application/pdf,.pdf" multiple name="sourcePdfs" type="file" onChange={(event) => {
            const nextFiles = Array.from(event.currentTarget.files ?? []);
            setFiles(nextFiles);
            updateItemCount(nextFiles, urls);
          }} />
        </label>
        <label className="source-url-input">External PDF links <span>One HTTP(S) link per line. Links are saved as references and are not downloaded.</span>
          <textarea name="sourceUrls" onChange={(event) => {
            const nextUrls = event.currentTarget.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
            setUrls(nextUrls);
            updateItemCount(files, nextUrls);
          }} placeholder={"https://publisher.example/research/report.pdf\nhttps://another.example/whitepaper.pdf"} rows={5} />
        </label>
      </div>
      {sourceItems.length > 0 && (
        <fieldset className="source-schedule-list">
          <legend>Set a different schedule for every item</legend>
          <p>Each source must have its own future date. A date already assigned to another source cannot be reused.</p>
          {reservedDates.length > 0 && <p>Dates currently in use: {reservedDates.join(", ")}</p>}
          {sourceItems.map((item, index) => (
            <label className="source-schedule-item" key={item.key}>
              <span><small>{item.kind} {index + 1}</small><strong>{item.label}</strong></span>
              <input
                aria-label={`Schedule date for ${item.label}`}
                onChange={(event) => {
                  const date = event.currentTarget.value;
                  setScheduleValues((current) => current.map((value, valueIndex) => valueIndex === index ? date : value));
                }}
                required
                type="datetime-local"
                value={scheduleValues[index] ?? ""}
              />
              <input name="sourceSchedules" type="hidden" value={scheduleValues[index] ? new Date(scheduleValues[index]).toISOString() : ""} />
              <input name="sourceScheduleDays" type="hidden" value={scheduleValues[index]?.slice(0, 10) ?? ""} />
            </label>
          ))}
          {scheduleError && <p className="form-error" role="alert">{scheduleError}</p>}
        </fieldset>
      )}
      <div className="source-batch-options">
        <label>Rights status<select defaultValue="unknown" name="rightsStatus"><option value="unknown">Unknown — review required</option><option value="review_required">Review required</option><option value="allowed">Allowed — evidence needed</option><option value="blocked">Blocked</option><option value="expired">Expired</option></select></label>
        <label className="source-evidence">Rights evidence / permission basis <span>Required before a generated draft can be approved for publishing.</span><input maxLength={2000} name="rightsEvidence" placeholder="License, ownership, or approval reference" /></label>
      </div>
      <TargetSitePicker
        initialSelected={sites.map((site) => site.slug)}
        legend="Generate content for these sites"
        name="targetSiteSlugs"
        showDraftLabel
        sites={sites}
      />
      <p className="source-site-batch-note">These site targets apply to every PDF and link in this batch. Each uploaded PDF can generate one separate draft per selected site; publishing remains a manual review step.</p>
      <div className="source-intake-footer"><p>Source PDFs remain private. External URLs are never fetched by this server. AI generation requires a configured provider and will save drafts for review.</p><button className="button button-dark" type="submit">Add to source library <span aria-hidden="true">↗</span></button></div>
    </form>
  );
}

export function SourceDocumentEditor({ source, sites }: { source: SourceDocumentRecord; sites: SiteRecord[] }) {
  const schedule = useScheduleSubmit();
  const sourceFilename = source.originalFilename || (source.sourceUrl ? new URL(source.sourceUrl).hostname : "Source PDF");
  const outputSites = source.targetSiteSlugs.map((slug) => sites.find((site) => site.slug === slug));
  return (
    <details className="source-record">
      <summary>
        <span className="source-file-icon" aria-hidden="true">{source.sourceAsset ? "PDF" : "URL"}</span>
        <span className="source-record-name"><strong>{source.title}</strong><small>{sourceFilename}</small></span>
        <span className={`source-schedule-state ${source.scheduledAt ? "has-date" : ""}`}>{source.scheduledAt ? new Date(source.scheduledAt).toLocaleString() : "No schedule"}</span>
        <span className={`status-pill status-${source.status}`}>{source.status}</span>
        <span className="source-edit-label">Edit <span aria-hidden="true">⌄</span></span>
      </summary>
      <div className="source-record-body">
        {source.sourceAsset && <p className="source-private-link"><a href={source.sourceAsset}>Download private source PDF ↗</a><span>Admin only</span></p>}
        {source.sourceUrl && <p className="source-private-link"><a href={source.sourceUrl} rel="noreferrer" target="_blank">Open external source ↗</a><span>Reference only</span></p>}
        {source.error && <p className="form-error" role="alert">{source.error}</p>}
        {source.generatedPaperIds.length > 0 && <div className="source-generated-output"><strong>Review generated drafts</strong>{source.generatedPaperIds.map((id, index) => <Link href={`/admin/content/${id}`} key={id}>{outputSites[index]?.name ?? "Target site"} · Open draft #{id} ↗</Link>)}</div>}
        {source.sourceAsset && source.status !== "generated" && source.status !== "processing" && (
          <form action={`/api/admin/source-documents/${source.id}/generate`} className="source-generate-form" method="post">
            <div><strong>Generate site-specific drafts</strong><small>Reads extracted PDF text and saves one draft per selected site. SEO/GEO fields and page-cited facts are required. Human review remains mandatory.</small></div>
            <button className="button button-dark" type="submit">Generate with AI <span aria-hidden="true">✦</span></button>
          </form>
        )}
        {source.status === "processing" && <p className="source-processing" role="status">AI generation is in progress. Refresh this page shortly.</p>}
        {source.sourceUrl && !source.sourceAsset && <p className="source-processing">Generation is unavailable for external links because the server does not fetch them. Upload the PDF to enable private extraction.</p>}
        {source.status === "generated" && source.generatedPaperIds.length === 0 && <p className="source-processing">The generated drafts were removed. Edit this source to prepare a new generation run.</p>}
        <form action={`/api/admin/source-documents/${source.id}`} className="source-record-form" method="post" onSubmit={schedule.onSubmit}>
          <input name="originalFilename" type="hidden" value={source.originalFilename} />
          <input name="sourceAsset" type="hidden" value={source.sourceAsset} />
          <label>Document title<input defaultValue={source.title} maxLength={240} name="title" required /></label>
          <label className="source-form-wide">External PDF URL<input defaultValue={source.sourceUrl} maxLength={2048} name="sourceUrl" type="url" /></label>
          <label>Schedule date &amp; time<input defaultValue={localDateTime(source.scheduledAt)} ref={schedule.localRef} required type="datetime-local" /></label>
          <input ref={schedule.isoRef} name="scheduledAt" type="hidden" />
          <label>Rights status<select defaultValue={source.rightsStatus} name="rightsStatus"><option value="unknown">Unknown</option><option value="review_required">Review required</option><option value="allowed">Allowed</option><option value="blocked">Blocked</option><option value="expired">Expired</option></select></label>
          <label className="source-form-wide">Rights evidence<input defaultValue={source.rightsEvidence} maxLength={2000} name="rightsEvidence" /></label>
          <TargetSitePicker
            className="source-form-wide"
            initialSelected={source.targetSiteSlugs}
            legend="Target sites"
            name="targetSiteSlugs"
            sites={sites}
          />
          <div className="source-row-actions source-form-wide"><button className="button button-dark" type="submit">Save source</button></div>
        </form>
        <form action={`/api/admin/source-documents/${source.id}/delete`} method="post" onSubmit={(event) => { if (!window.confirm("Delete this source record and its private uploaded PDF?")) event.preventDefault(); }}>
          <button className="source-delete-button" type="submit">Delete source</button>
        </form>
      </div>
    </details>
  );
}
