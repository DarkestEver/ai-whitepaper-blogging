"use client";

import { AdminShell } from "@/components/admin-shell";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <AdminShell>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Error</p>
          <h1>Something went <em>wrong.</em></h1>
          <p>An unexpected error occurred. Please try again or return to the overview.</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button className="button button-dark" onClick={reset} type="button">
          Try again <span aria-hidden="true">↻</span>
        </button>
        <a className="button button-dark" href="/admin">
          Back to overview <span aria-hidden="true">↗</span>
        </a>
      </div>
    </AdminShell>
  );
}
