"use client";

import { useState } from "react";

interface ContentItem {
  id: number;
  title: string;
  status: "published" | "draft" | "scheduled" | "archived";
  editorialStatus: "draft" | "in_review" | "approved" | "changes_requested";
  publishedAt?: string;
  updatedAt: string;
}

interface SiteContentTableProps {
  publishedItems: ContentItem[];
  draftItems: ContentItem[];
}

const STATUS_COLORS = {
  published: { bg: "rgba(46, 125, 50, 0.1)", text: "#2e7d32", label: "Published" },
  draft: { bg: "rgba(245, 124, 0, 0.1)", text: "#f57c00", label: "Draft" },
  scheduled: { bg: "rgba(0, 102, 204, 0.1)", text: "#0066cc", label: "Scheduled" },
  archived: { bg: "rgba(117, 117, 117, 0.1)", text: "#757575", label: "Archived" },
};

const EDITORIAL_STATUS_COLORS = {
  draft: { text: "#757575", label: "Draft" },
  in_review: { text: "#f57c00", label: "In Review" },
  approved: { text: "#2e7d32", label: "Approved" },
  changes_requested: { text: "#c62828", label: "Changes Requested" },
};

export function SiteContentTable({ publishedItems, draftItems }: SiteContentTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Combine all items
  const allItems: (ContentItem & { type: "published" | "draft" })[] = [
    ...publishedItems.map((item) => ({ ...item, type: "published" as const })),
    ...draftItems.map((item) => ({ ...item, type: "draft" as const })),
  ];

  // Filter by status
  let filteredItems = allItems;
  if (statusFilter !== "all") {
    filteredItems = allItems.filter((item) => item.status === statusFilter);
  }

  // Sort
  if (sortBy === "recent") {
    filteredItems.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } else if (sortBy === "oldest") {
    filteredItems.sort(
      (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
  } else if (sortBy === "title") {
    filteredItems.sort((a, b) => a.title.localeCompare(b.title));
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "12px",
              color: "var(--muted)",
              fontWeight: "600",
            }}
          >
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <option value="all">All Content</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
              <option value="scheduled">Scheduled Only</option>
            </select>
          </label>
        </div>

        <div>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "12px",
              color: "var(--muted)",
              fontWeight: "600",
            }}
          >
            Sort By
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </label>
        </div>

        <div
          style={{
            marginLeft: "auto",
            fontSize: "12px",
            color: "var(--muted)",
            fontWeight: "600",
          }}
        >
          {filteredItems.length} items
        </div>
      </div>

      {/* Table */}
      {filteredItems.length > 0 ? (
        <div
          style={{
            overflowX: "auto",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "var(--paper-secondary)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "var(--muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Title
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "var(--muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Status
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "var(--muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Editorial
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "var(--muted)", fontSize: "11px", textTransform: "uppercase" }}>
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const statusColor = STATUS_COLORS[item.status];
                const editorialColor = EDITORIAL_STATUS_COLORS[item.editorialStatus];

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                        "var(--paper-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ padding: "14px 16px", fontWeight: "500", color: "var(--ink)" }}>
                      {item.title}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        {statusColor.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          color: editorialColor.text,
                          fontSize: "11px",
                          fontWeight: "600",
                        }}
                      >
                        {editorialColor.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: "12px" }}>
                      {formatDate(item.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--muted)",
            backgroundColor: "var(--paper-secondary)",
            borderRadius: "12px",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ margin: 0 }}>No content found</p>
          <p style={{ margin: "4px 0 0", fontSize: "12px" }}>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
