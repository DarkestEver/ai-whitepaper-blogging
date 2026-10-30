"use client";

import { usePathname } from "next/navigation";

const pageLabels: Record<string, string> = {
  "/admin": "Overview",
  "/admin/sources": "PDF Library",
  "/admin/content": "Content",
  "/admin/content/new": "New Entry",
  "/admin/sites": "Site Settings",
  "/admin/themes": "Theme Catalog",
  "/admin/integrations": "Integrations",
};

function resolveLabel(pathname: string): string {
  if (pageLabels[pathname]) return pageLabels[pathname];
  if (pathname.startsWith("/admin/content/")) return "Edit Entry";
  return "Workspace";
}

export function AdminTopbar() {
  const pathname = usePathname();
  const label = resolveLabel(pathname);

  return (
    <header className="admin-topbar">
      <div>
        <span>{label.toUpperCase()}</span>
        <strong>Signal Library</strong>
      </div>
      <form action="/api/admin/logout" method="post">
        <button className="admin-signout" type="submit">
          <span className="signout-icon" aria-hidden="true">↗</span>
          Sign out
        </button>
      </form>
    </header>
  );
}
