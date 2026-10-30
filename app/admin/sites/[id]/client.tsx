"use client";

import Link from "next/link";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import type { SiteRecord } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface ContentItem {
  id: number;
  title: string;
  slug: string;
  status: string;
  editorial: string;
  updated: string;
}

interface SiteDetailPageClientProps {
  site: SiteRecord;
  status: string;
  publishedCount: number;
  draftCount: number;
  contentItems: ContentItem[];
  modal?: string | null;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  published: { label: "Published", cls: "badge-success" },
  draft: { label: "Draft", cls: "badge-warning" },
  scheduled: { label: "Scheduled", cls: "badge-info" },
};

const EDITORIAL_MAP: Record<string, { label: string; cls: string }> = {
  approved: { label: "Approved", cls: "badge-success" },
  in_review: { label: "In Review", cls: "badge-warning" },
  draft: { label: "Draft", cls: "badge-muted" },
  changes_requested: { label: "Changes Requested", cls: "badge-danger" },
};

export function SiteDetailPageClient({
  site,
  status,
  publishedCount,
  draftCount,
  contentItems,
  modal,
}: SiteDetailPageClientProps) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(!!modal);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteContentItem, setDeleteContentItem] = useState<{ id: number; title: string } | null>(null);

  const filtered = statusFilter === "all"
    ? contentItems
    : contentItems.filter((c) => c.status === statusFilter);

  return (
    <>
      {/* Breadcrumb */}
      <nav className="admin-breadcrumb" aria-label="Breadcrumb">
        <Link href="/admin">Control room</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/sites">Site registry</Link>
        <span aria-hidden="true">/</span>
        <span>{site.name}</span>
      </nav>

      {/* Site Header - compact row */}
      <div className="detail-header">
        <div className="detail-header-left">
          <div className="detail-avatar-lg">
            {site.logoUrl ? (
              <img src={site.logoUrl} alt="" />
            ) : (
              <span>{site.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{site.name}</h1>
            <p className="text-muted" style={{ margin: "4px 0 0" }}>
              {site.publicUrl || "No URL configured"} &middot;{" "}
              <span className={`badge ${status === "ready" ? "badge-success" : "badge-muted"}`}>
                {status === "ready" ? "Ready" : "Incomplete"}
              </span>
            </p>
          </div>
        </div>
        <div className="detail-actions">
          <Link href={`/admin/sites/${site.id}/settings`} className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </Link>
          <button className="btn" onClick={() => {
            document.cookie = `__dev_site=${site.id};path=/;max-age=86400`;
            window.open(site.publicUrl || "/", "_blank");
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Preview site
          </button>
          <button
            className="btn btn-danger-outline"
            onClick={() => { router.push(`/admin/sites/${site.id}?modal=delete`); setIsDeleteOpen(true); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </button>
        </div>
      </div>

      {/* Compact Info Row: stats + config in one horizontal strip */}
      <div className="info-strip">
        <div className="info-strip-item">
          <span className="info-strip-value" style={{ color: "#2e7d32" }}>{publishedCount}</span>
          <span className="info-strip-label">Published</span>
        </div>
        <div className="info-strip-divider" />
        <div className="info-strip-item">
          <span className="info-strip-value" style={{ color: "#f57c00" }}>{draftCount}</span>
          <span className="info-strip-label">Drafts</span>
        </div>
        <div className="info-strip-divider" />
        <div className="info-strip-item">
          <span className="info-strip-value">{publishedCount + draftCount}</span>
          <span className="info-strip-label">Total</span>
        </div>
        <div className="info-strip-divider" />
        <div className="info-strip-item">
          <code className="info-strip-value" style={{ fontSize: "13px" }}>/{site.slug}</code>
          <span className="info-strip-label">Slug</span>
        </div>
        <div className="info-strip-divider" />
        <div className="info-strip-item">
          <span className="info-strip-value" style={{ fontSize: "13px" }}>{site.themeId || "default"}</span>
          <span className="info-strip-label">Theme</span>
        </div>
        <div className="info-strip-divider" />
        <div className="info-strip-item">
          <span className={`badge ${site.indexingEnabled ? "badge-success" : "badge-muted"}`}>
            {site.indexingEnabled ? "On" : "Off"}
          </span>
          <span className="info-strip-label">Indexing</span>
        </div>
      </div>

      {/* Content Table - directly on detail page */}
      <section className="detail-section">
        <div className="section-header">
          <h2>Content ({filtered.length})</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="inline-filter"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="site-table-wrap">
            <table className="site-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Editorial</th>
                  <th>Updated</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const st = STATUS_MAP[item.status] || { label: item.status, cls: "badge-muted" };
                  const ed = EDITORIAL_MAP[item.editorial] || { label: item.editorial, cls: "badge-muted" };
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.title}</strong></td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td><span className={`badge ${ed.cls}`}>{ed.label}</span></td>
                      <td className="text-muted">{item.updated}</td>
                      <td>
                        <div className="row-actions">
                          <Link
                            href={`/admin/sites/${site.id}/content/${item.id}`}
                            className="action-icon"
                            title="Edit"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </Link>
                          <button className="action-icon" title="View" onClick={() => window.open(`/whitepapers/${item.slug}`, "_blank")}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button className="action-icon action-danger" title="Delete" onClick={() => setDeleteContentItem({ id: item.id, title: item.title })}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No content matching this filter.</p>
          </div>
        )}
      </section>

      {/* Delete Site Modal */}
      {isDeleteOpen && modal === "delete" && (
        <DeleteConfirmationModal
          itemName={site.name}
          itemId={site.id}
          onClose={() => { router.push(`/admin/sites/${site.id}`); setIsDeleteOpen(false); }}
          deleteUrl={`/api/admin/sites/${site.id}/delete`}
        />
      )}

      {/* Delete Content Modal */}
      {deleteContentItem && (
        <DeleteConfirmationModal
          itemName={deleteContentItem.title}
          itemId={deleteContentItem.id}
          onClose={() => { setDeleteContentItem(null); router.refresh(); }}
          deleteUrl={`/api/admin/content/${deleteContentItem.id}/delete`}
        />
      )}
    </>
  );
}
