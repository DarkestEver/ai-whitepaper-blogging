import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { SiteContentPageClient } from "./client";
import { requireAdmin } from "@/lib/auth";
import { findSiteById, listWhitepapers } from "@/lib/db";
import { notFound } from "next/navigation";

type SiteContentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; sort?: string; page?: string }>;
};

export const metadata = { title: "Site content", robots: { index: false, follow: false } };

export default async function SiteContentPage({ params, searchParams }: SiteContentPageProps) {
  await requireAdmin();
  const { id } = await params;
  const siteId = Number(id);
  if (!Number.isSafeInteger(siteId) || siteId <= 0) notFound();

  const site = await findSiteById(siteId);
  if (!site) notFound();

  const allContent = await listWhitepapers({ includeNonPublic: true, siteId });
  const contentItems = allContent.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    status: c.status,
    editorial: c.editorialStatus,
    updated: c.updatedAt.split("T")[0],
  }));

  const query = await searchParams;

  return (
    <AdminShell>
      <nav className="admin-breadcrumb" aria-label="Breadcrumb">
        <Link href="/admin">Control room</Link>
        <span aria-hidden="true">/</span>
        <Link href="/admin/sites">Site registry</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/admin/sites/${site.id}`}>{site.name}</Link>
        <span aria-hidden="true">/</span>
        <span>Content</span>
      </nav>

      <div className="detail-header">
        <div>
          <h1 style={{ margin: 0 }}>{site.name} &mdash; Content</h1>
          <p className="text-muted" style={{ margin: "4px 0 0" }}>Manage published and draft papers</p>
        </div>
        <Link href={`/admin/sites/${site.id}`} className="btn">Back to detail</Link>
      </div>

      <SiteContentPageClient
        siteId={site.id}
        contentItems={contentItems}
        statusFilter={query.status || "all"}
        sortBy={query.sort || "recent"}
        page={Number(query.page) || 1}
      />
    </AdminShell>
  );
}
