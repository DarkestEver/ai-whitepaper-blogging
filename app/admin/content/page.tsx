import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin-shell";
import { getUserFromSession } from "@/lib/auth";
import { listWhitepapers } from "@/lib/db";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";
import { redirect } from "next/navigation";
import { formatRelativeTime } from "@/lib/time-utils";

type ContentPageProps = { searchParams: Promise<{ deleted?: string; q?: string; status?: string }> };
export const metadata = { title: "Content", robots: { index: false, follow: false } };

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const userSession = await getUserFromSession();
  if (!userSession) redirect("/admin/login");

  await connectDatabase();
  const user = await User.findOne({ numericId: userSession.userId });
  if (!user || !user.isActive) redirect("/admin/login");

  const userSiteIds = new Set(user.domainRoles.map((dr: any) => dr.siteId));
  const allPapers = await listWhitepapers({ includeNonPublic: true });
  const userPapers = allPapers.filter((paper) => userSiteIds.has(paper.siteId));
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase().slice(0, 100) : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const papers = userPapers.filter((paper) => {
    if (statusFilter && paper.status !== statusFilter) return false;
    if (query && !paper.title.toLowerCase().includes(query) && !paper.slug.toLowerCase().includes(query) && !paper.category.toLowerCase().includes(query)) return false;
    return true;
  });
  const statusCounts = {
    all: userPapers.length,
    published: userPapers.filter((p) => p.status === "published").length,
    draft: userPapers.filter((p) => p.status === "draft").length,
    scheduled: userPapers.filter((p) => p.status === "scheduled").length,
    archived: userPapers.filter((p) => p.status === "archived").length,
  };

  return (
    <AdminShell>
      <div className="admin-page-heading">
        <div><nav className="admin-breadcrumb" aria-label="Breadcrumb"><Link href="/admin">Control room</Link><span aria-hidden="true">/</span><span>Content</span></nav><h1>Research <em>catalog.</em></h1><p>Create and manage locally stored prototype entries.</p></div>
        <Link className="button button-dark" href="/admin/content/new">Create entry <span aria-hidden="true">+</span></Link>
      </div>
      {params.deleted === "1" && <p className="form-success" role="status">Entry deleted.</p>}

      <div className="content-filter-bar">
        <form className="content-search" action="/admin/content" method="get" role="search">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input name="q" type="search" placeholder="Search by title, slug, or topic…" defaultValue={query} maxLength={100} />
          <button className="button button-search" type="submit">Search</button>
        </form>
        <nav className="content-status-tabs" aria-label="Filter by status">
          <Link className={`content-tab${!statusFilter ? " is-active" : ""}`} href={query ? `/admin/content?q=${encodeURIComponent(query)}` : "/admin/content"}>All <span>{statusCounts.all}</span></Link>
          <Link className={`content-tab${statusFilter === "published" ? " is-active" : ""}`} href={`/admin/content?status=published${query ? `&q=${encodeURIComponent(query)}` : ""}`}>Published <span>{statusCounts.published}</span></Link>
          <Link className={`content-tab${statusFilter === "draft" ? " is-active" : ""}`} href={`/admin/content?status=draft${query ? `&q=${encodeURIComponent(query)}` : ""}`}>Drafts <span>{statusCounts.draft}</span></Link>
          <Link className={`content-tab${statusFilter === "scheduled" ? " is-active" : ""}`} href={`/admin/content?status=scheduled${query ? `&q=${encodeURIComponent(query)}` : ""}`}>Scheduled <span>{statusCounts.scheduled}</span></Link>
          <Link className={`content-tab${statusFilter === "archived" ? " is-active" : ""}`} href={`/admin/content?status=archived${query ? `&q=${encodeURIComponent(query)}` : ""}`}>Archived <span>{statusCounts.archived}</span></Link>
        </nav>
      </div>

      <section className="admin-panel">
        {papers.length > 0 ? (
          <>
            <div className="admin-panel-heading"><div><p className="eyebrow">Showing {papers.length} of {allPapers.length} entries</p></div></div>
            <div className="admin-table-wrap">
              <table className="admin-table"><thead><tr><th>Title</th><th>Slug</th><th>Topic</th><th>Status</th><th>Editorial review</th><th>Scheduled for</th><th>Read time</th><th>Updated</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
                <tbody>{papers.map((paper) => <tr key={paper.id}><td><Link href={`/admin/content/${paper.id}`}>{paper.title}</Link></td><td className="admin-code">/{paper.slug}</td><td>{paper.category}</td><td><StatusPill status={paper.status} /></td><td><StatusPill status={paper.editorialStatus} /></td><td title={paper.status === "scheduled" ? new Date(paper.scheduledAt).toLocaleString() : undefined}>{paper.status === "scheduled" ? formatRelativeTime(paper.scheduledAt) : "—"}</td><td>{paper.readingMinutes} min</td><td><span title={new Date(paper.updatedAt).toLocaleString()}>{formatRelativeTime(paper.updatedAt)}</span></td><td><Link href={`/admin/content/${paper.id}`}>Edit →</Link></td></tr>)}</tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="content-empty">
            <span className="content-empty-icon" aria-hidden="true">☰</span>
            <h3>{query || statusFilter ? "No matching entries" : "No content yet"}</h3>
            <p>{query || statusFilter ? "Try a different search or filter." : "Create your first research entry to get started."}</p>
            {(query || statusFilter) && <Link className="admin-text-link" href="/admin/content">Clear filters →</Link>}
            {!query && !statusFilter && <Link className="button button-dark" href="/admin/content/new">Create entry <span aria-hidden="true">+</span></Link>}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
