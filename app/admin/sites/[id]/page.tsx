import { AdminShell } from "@/components/admin-shell";
import { SiteDetailPageClient } from "./client";
import { requireAdmin } from "@/lib/auth";
import { findSiteById, listWhitepapers } from "@/lib/db";
import { notFound } from "next/navigation";

type SiteDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modal?: string }>;
};

export const metadata = { title: "Site detail", robots: { index: false, follow: false } };

export default async function SiteDetailPage({ params, searchParams }: SiteDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const siteId = Number(id);
  if (!Number.isSafeInteger(siteId) || siteId <= 0) notFound();

  const site = await findSiteById(siteId);
  if (!site) notFound();

  const allContent = await listWhitepapers({ includeNonPublic: true, siteId });
  const publishedCount = allContent.filter((c) => c.status === "published").length;
  const draftCount = allContent.filter((c) => c.status === "draft").length;

  const contentItems = allContent.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    status: c.status,
    editorial: c.editorialStatus,
    updated: c.updatedAt.split("T")[0],
  }));

  const query = await searchParams;
  const status = site.publicUrl ? "ready" : "incomplete";

  return (
    <AdminShell>
      <SiteDetailPageClient
        site={site}
        status={status}
        publishedCount={publishedCount}
        draftCount={draftCount}
        contentItems={contentItems}
        modal={query.modal}
      />
    </AdminShell>
  );
}
