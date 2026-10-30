"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SiteRecord } from "@/lib/db";

interface SitesListClientProps {
  sites: SiteRecord[];
  total: number;
  pages: number;
  page: number;
  pageSize: number;
  search?: string;
}

function SiteInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function SitesListClient({ sites, total, pages, page, pageSize, search }: SitesListClientProps) {
  const router = useRouter();

  function buildUrl(p?: number, s?: string) {
    const params = new URLSearchParams();
    if (s) params.set("search", s);
    if (p && p > 1) params.set("page", String(p));
    const q = params.toString();
    return `/admin/sites${q ? `?${q}` : ""}`;
  }

  return (
    <div className="site-registry">
      {/* Search Bar */}
      <div className="site-search-bar">
        <form
          method="get"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            router.push(buildUrl(1, fd.get("search") as string));
          }}
        >
          <div className="search-field">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              name="search"
              placeholder="Search sites by name, domain, or slug..."
              defaultValue={search || ""}
            />
            <button type="submit" className="btn btn-sm">Search</button>
            {search && (
              <Link href="/admin/sites" className="btn btn-sm btn-ghost">Clear</Link>
            )}
          </div>
        </form>
        <span className="site-count">{total} site{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Sites Table */}
      {sites.length > 0 ? (
        <div className="site-table-wrap">
          <table className="site-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Updated</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr
                  key={site.id}
                  onClick={() => router.push(`/admin/sites/${site.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <div className="site-cell">
                      <div className="site-avatar">
                        {site.logoUrl ? (
                          <img src={site.logoUrl} alt="" />
                        ) : (
                          <span>{SiteInitial(site.name)}</span>
                        )}
                      </div>
                      <div>
                        <strong>{site.name}</strong>
                        <small>/{site.slug}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="domain-text">
                      {site.publicUrl || <em style={{ color: "var(--muted)" }}>Not set</em>}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${site.publicUrl ? "badge-success" : "badge-muted"}`}>
                      {site.publicUrl ? "Ready" : "Incomplete"}
                    </span>
                  </td>
                  <td className="text-muted">{timeAgo(site.updatedAt)}</td>
                  <td>
                    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/admin/sites/${site.id}`}
                        className="action-icon"
                        title="View details"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </Link>
                      <button
                        className="action-icon"
                        title="Preview site"
                        onClick={() => {
                          document.cookie = `__dev_site=${site.id};path=/;max-age=86400`;
                          window.open("/", "_blank");
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </button>
                      <Link
                        href={`/admin/sites/${site.id}/settings`}
                        className="action-icon"
                        title="Settings"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      </Link>
                      <Link
                        href={`/admin/sites/${site.id}?modal=delete`}
                        className="action-icon action-danger"
                        title="Delete"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>{search ? "No sites match your search." : "No sites registered yet."}</p>
          {!search && (
            <Link href="/admin/sites?modal=new" className="btn btn-primary">Register your first site</Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => router.push(buildUrl(page - 1, search))}
          >
            Previous
          </button>
          <div className="pagination-pages">
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              let p: number;
              if (pages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= pages - 3) p = pages - 6 + i;
              else p = page - 3 + i;
              return (
                <button
                  key={p}
                  className={`btn btn-sm ${p === page ? "btn-primary" : ""}`}
                  onClick={() => router.push(buildUrl(p, search))}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button
            className="btn btn-sm"
            disabled={page >= pages}
            onClick={() => router.push(buildUrl(page + 1, search))}
          >
            Next
          </button>
          <span className="text-muted text-xs">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
        </div>
      )}
    </div>
  );
}
