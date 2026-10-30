import { AdminShell } from "@/components/admin-shell";
import { ContentEditPageClient } from "./client";
import { requireAdmin } from "@/lib/auth";
import { findSiteById, findWhitepaperById } from "@/lib/db";
import { notFound } from "next/navigation";

type ContentEditPageProps = {
  params: Promise<{ id: string; contentId: string }>;
};

export const metadata = { title: "Edit content", robots: { index: false, follow: false } };

export default async function ContentEditPage({ params }: ContentEditPageProps) {
  await requireAdmin();
  const { id, contentId } = await params;
  const siteId = Number(id);
  const cId = Number(contentId);

  if (!Number.isSafeInteger(siteId) || siteId <= 0) notFound();
  if (!Number.isSafeInteger(cId) || cId <= 0) notFound();

  const site = await findSiteById(siteId);
  if (!site) notFound();

  const paper = await findWhitepaperById(cId);
  if (!paper || paper.siteId !== siteId) notFound();

  return (
    <AdminShell>
      <ContentEditPageClient siteId={siteId} contentId={cId} paper={paper} />
    </AdminShell>
  );
}
