import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { SitesListClient } from "./client";
import { isAdminAuthenticated } from "@/lib/auth";
import { listSitesPaginated } from "@/lib/db";
import { redirect } from "next/navigation";

type SitePageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
};
export const metadata = { title: "Site registry", robots: { index: false, follow: false } };

export default async function SiteRegistryPage({ searchParams }: SitePageProps) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const search = query.search?.trim();
  const pageSize = 50;
  const { sites, total, pages } = await listSitesPaginated(page, pageSize, search);

  return (
    <AdminShell>
      <div className="admin-page-heading">
        <div>
          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <Link href="/admin">Control room</Link>
            <span aria-hidden="true">/</span>
            <span>Site registry</span>
          </nav>
          <h1>Site registry</h1>
          <p>Manage your registered sites, domains, and configurations.</p>
        </div>
        <Link href="/admin/sites?modal=new" className="btn btn-primary">
          + Register new site
        </Link>
      </div>

      <SitesListClient
        sites={sites}
        total={total}
        pages={pages}
        page={page}
        pageSize={pageSize}
        search={search}
      />
    </AdminShell>
  );
}
