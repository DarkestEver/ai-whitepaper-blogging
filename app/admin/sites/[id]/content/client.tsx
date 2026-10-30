"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ContentItem } from "../client";

interface SiteContentPageClientProps {
  siteId: number;
  contentItems: ContentItem[];
  statusFilter: string;
  sortBy: string;
  page: number;
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

export function SiteContentPageClient({ siteId, contentItems, statusFilter, sortBy, page }: SiteContentPageClientProps) {
  const router = useRouter();

  function buildUrl(newStatus?: string, newSort?: string) {
    const params = new URLSearchParams();
    if (newStatus && newStatus !== "all") params.append("status", newStatus);
    if (newSort && newSort !== "recent") params.append("sort", newSort);
    const query = params.toString();
    return `/admin/sites/${siteId}/content${query ? `?${query}` : ""}`;
  }

  const filtered = statusFilter === "all"
    ? contentItems
    : contentItems.filter((c) => c.status === statusFilter);

  return (
    <>
      {/* Filters */}
      <div className="content-filters">
        <div className="filter-group">
          <label>
            <span className="filter-label">Status</span>
            <select value={statusFilter} onChange={(e) => router.push(buildUrl(e.target.value, sortBy))}>
              <option value="all">All content</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </label>
          <label>
            <span className="filter-label">Sort by</span>
            <select value={sortBy} onChange={(e) => router.push(buildUrl(statusFilter, e.target.value))}>
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </label>
        </div>
        <span className="text-muted text-xs">{filtered.length} items</span>
      </div>

      {/* Content Table */}
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
                        <Link href={`/admin/sites/${siteId}/content/${item.id}`} className="action-icon" title="Edit">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Link>
                        <button className="action-icon" title="View" onClick={() => window.open(`/whitepapers/${item.slug}`, "_blank")}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
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
          <p>No content found matching your filters.</p>
        </div>
      )}
    </>
  );
}
