import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin-shell";
import { ContentForm } from "@/components/content-form";
import { getUserFromSession } from "@/lib/auth";
import { findWhitepaperById, listEditorialReviewEvents, listSites } from "@/lib/db";
import { paperFormData } from "@/lib/paper-form";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";

type EditPageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; review?: string }> };
export const metadata = { title: "Edit content", robots: { index: false, follow: false } };

export default async function EditContentPage({ params, searchParams }: EditPageProps) {
  const userSession = await getUserFromSession();
  if (!userSession) redirect("/admin/login");

  await connectDatabase();
  const user = await User.findOne({ numericId: userSession.userId });
  if (!user || !user.isActive) redirect("/admin/login");

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const paper = await findWhitepaperById(id);
  if (!paper) notFound();

  // Check domain access
  const userSiteIds = new Set(user.domainRoles.map((dr: any) => dr.siteId));
  if (!userSiteIds.has(paper.siteId)) notFound();

  const sites = await listSites();
  const userAccessibleSites = sites.filter((s) => userSiteIds.has(s.id));
  const reviewEvents = await listEditorialReviewEvents(id);
  const query = await searchParams;

  return (
    <AdminShell>
      <div className="admin-page-heading"><div><nav className="admin-breadcrumb" aria-label="Breadcrumb"><Link href="/admin">Control room</Link><span aria-hidden="true">/</span><Link href="/admin/content">Content</Link><span aria-hidden="true">/</span><span>Edit</span></nav><h1>Edit <em>entry.</em></h1><p>Changes are saved directly to the MongoDB workspace.</p></div><div><StatusPill status={paper.status} /> <StatusPill status={paper.editorialStatus} /></div></div>
      {query.saved === "1" && <p className="form-success" role="status">Changes saved.</p>}
      {query.review && <p className="form-success" role="status">Editorial action recorded: {query.review.replaceAll("_", " ")}.</p>}
      <section className="admin-panel" aria-labelledby="editorial-review-heading">
        <div className="admin-panel-heading"><div><p className="eyebrow">Editorial workflow</p><h2 id="editorial-review-heading">Review &amp; approval</h2></div><StatusPill status={paper.editorialStatus} /></div>
        <p className="admin-body-copy">Local prototype review only. Approval is a deliberate step before this entry can be scheduled or published. Editing any content after approval returns it to draft.</p>
        {paper.editorialStatus === "draft" || paper.editorialStatus === "changes_requested" ? (
          <form action={`/api/admin/content/${paper.id}/review`} method="post">
            <input name="action" type="hidden" value="submit" />
            <button className="button button-dark" type="submit">Submit for review</button>
          </form>
        ) : null}
        {paper.editorialStatus === "in_review" ? (
          <div className="admin-review-actions">
            <form action={`/api/admin/content/${paper.id}/review`} method="post">
              <input name="action" type="hidden" value="approve" />
              <button className="button button-dark" type="submit">Approve entry</button>
            </form>
            <form action={`/api/admin/content/${paper.id}/review`} className="admin-form" method="post">
              <input name="action" type="hidden" value="request_changes" />
              <label>Changes requested<textarea name="note" minLength={5} maxLength={1000} required rows={2} /></label>
              <button className="button button-dark" type="submit">Return for changes</button>
            </form>
          </div>
        ) : null}
        {paper.editorialStatus === "approved" && <p className="form-success" role="status">Approved. You may now schedule or publish this unchanged content.</p>}
        {reviewEvents.length > 0 && <ol className="editorial-review-history">{reviewEvents.map((event) => (
          <li key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time>{event.note && <p>{event.note}</p>}</li>
        ))}</ol>}
      </section>
      <ContentForm
        action={`/api/admin/content/${paper.id}`}
        submitLabel="Save changes"
        values={paperFormData(paper)}
        sites={userAccessibleSites}
        editorialStatus={paper.editorialStatus}
      />
      <details className="admin-danger-zone"><summary>Delete this entry</summary><p>This permanently removes this local demonstration record. This action cannot be undone.</p><form action={`/api/admin/content/${paper.id}/delete`} method="post"><button className="button button-danger" type="submit">Confirm permanent deletion</button></form></details>
      {paper.status === "published" && <p className="admin-inline-note">Public preview: <Link href={`/whitepapers/${paper.slug}`} rel="noreferrer" target="_blank">{paper.title} ↗</Link></p>}
    </AdminShell>
  );
}
