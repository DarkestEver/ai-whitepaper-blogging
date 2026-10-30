import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { SiteSettingsPageClient } from "./client";
import { requireAdmin } from "@/lib/auth";
import { findSiteById } from "@/lib/db";
import { notFound } from "next/navigation";

type SiteSettingsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export const metadata = { title: "Site settings", robots: { index: false, follow: false } };

export default async function SiteSettingsPage({ params, searchParams }: SiteSettingsPageProps) {
  await requireAdmin();
  const { id } = await params;
  const siteId = Number(id);
  if (!Number.isSafeInteger(siteId) || siteId <= 0) notFound();

  const site = await findSiteById(siteId);
  if (!site) notFound();

  const query = await searchParams;
  const activeTab = query.tab || "basic";

  return (
    <AdminShell>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "24px" }}>
        <nav className="admin-breadcrumb" aria-label="Breadcrumb">
          <Link href="/admin">Control room</Link>
          <span aria-hidden="true">/</span>
          <Link href="/admin/sites">Site registry</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/admin/sites/${site.id}`}>{site.name}</Link>
          <span aria-hidden="true">/</span>
          <span>Settings</span>
        </nav>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h1>{site.name}</h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>Configure site settings and legal documents</p>
      </div>

      <SiteSettingsPageClient site={site} activeTab={activeTab} />
    </AdminShell>
  );
}
