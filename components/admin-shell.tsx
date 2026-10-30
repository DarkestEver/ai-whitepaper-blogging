import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "./admin-nav";
import { AdminTopbar } from "./admin-topbar";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">Skip to admin content</a>
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span className="brand-mark">S</span>
          <span><strong>Signal Admin</strong><small>Local prototype workspace</small></span>
        </Link>
        <AdminNav />
        <div className="admin-sidebar-note">
          <span className="status-dot" />
          <span>Local demonstration data<br /><strong>Production features disabled</strong></span>
        </div>
      </aside>
      <section className="admin-workspace">
        <AdminTopbar />
        <main id="admin-main" className="admin-main">{children}</main>
      </section>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill status-${status.replaceAll("_", "-")}`}>{status.replaceAll("_", " ")}</span>;
}
