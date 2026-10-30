"use client";

import Link from "next/link";
import type { SiteRecord } from "@/lib/db";

interface SiteListCardProps {
  site: SiteRecord;
  publishedCount?: number;
  draftCount?: number;
}

function SiteInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString();
}

function getStatusBadge(publicUrl: boolean): {
  status: string;
  label: string;
  color: string;
} {
  if (!publicUrl) return { status: "incomplete", label: "Incomplete", color: "var(--muted)" };
  return { status: "ready", label: "Ready", color: "var(--accent)" };
}

export function SiteListCard({ site, publishedCount = 0, draftCount = 0 }: SiteListCardProps) {
  const status = getStatusBadge(!!site.publicUrl);
  const lastUpdated = formatDate(site.updatedAt);
  const totalContent = publishedCount + draftCount;

  return (
    <Link href={`/admin/sites/${site.id}`}>
      <article
        className="site-list-card"
        style={
          {
            "--card-hover-bg": "var(--paper-secondary)",
          } as React.CSSProperties
        }
      >
        <div className="site-logo-container">
          {site.logoUrl ? (
            <img
              src={site.logoUrl}
              alt={`${site.name} logo`}
              className="site-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.currentTarget.parentElement?.querySelector(
                  ".site-logo-fallback"
                ) as HTMLElement).style.display = "flex";
              }}
            />
          ) : null}
          {!site.logoUrl && (
            <div className="site-logo-fallback" style={{ background: "var(--accent)" }}>
              {SiteInitial(site.name)}
            </div>
          )}
        </div>

        <div className="site-info">
          <div className="site-title">
            <strong>{site.name}</strong>
            <span
              className="status-badge"
              style={{ color: status.color }}
              title={status.status}
            >
              {status.label}
            </span>
          </div>
          <p className="site-url">{site.publicUrl || "No URL configured"}</p>
          <p className="site-meta">
            {totalContent} paper{totalContent !== 1 ? "s" : ""} · {lastUpdated}
          </p>
        </div>

        <div className="site-actions" onClick={(e) => e.preventDefault()}>
          <button
            type="button"
            className="icon-button"
            title="View site"
            onClick={(e) => {
              e.preventDefault();
              if (site.publicUrl) window.open(site.publicUrl, "_blank");
            }}
          >
            👁️
          </button>
          <button
            type="button"
            className="icon-button"
            title="Settings"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/admin/sites/${site.id}?modal=settings`;
            }}
          >
            ⚙️
          </button>
          <button
            type="button"
            className="icon-button delete"
            title="Delete site"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/admin/sites/${site.id}?modal=delete`;
            }}
          >
            🗑️
          </button>
        </div>
      </article>
    </Link>
  );
}
