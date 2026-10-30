import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ContentForm } from "@/components/content-form";
import { getUserFromSession } from "@/lib/auth";
import { listSites } from "@/lib/db";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";
import { redirect } from "next/navigation";

export const metadata = { title: "Create content", robots: { index: false, follow: false } };

export default async function NewContentPage() {
  const userSession = await getUserFromSession();
  if (!userSession) redirect("/admin/login");

  await connectDatabase();
  const user = await User.findOne({ numericId: userSession.userId });
  if (!user || !user.isActive) redirect("/admin/login");

  const allSites = await listSites();
  const userSiteIds = new Set(user.domainRoles.map((dr: any) => dr.siteId));
  const sites = allSites.filter((site) => userSiteIds.has(site.id));
  return (
    <AdminShell>
      <div className="admin-page-heading"><div><nav className="admin-breadcrumb" aria-label="Breadcrumb"><Link href="/admin">Control room</Link><span aria-hidden="true">/</span><Link href="/admin/content">Content</Link><span aria-hidden="true">/</span><span>New</span></nav><h1>Create a <em>research entry.</em></h1><p>Entries start private. Submit for editorial review before scheduling or publishing.</p></div><Link className="admin-text-link" href="/admin/content">← All content</Link></div>
      <ContentForm action="/api/admin/content" submitLabel="Create entry" sites={sites} />
    </AdminShell>
  );
}
