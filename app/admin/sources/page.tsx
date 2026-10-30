import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { BulkSourceIntake, SourceDocumentEditor } from "@/components/source-library-forms";
import { getUserFromSession } from "@/lib/auth";
import { listSites, listSourceDocuments } from "@/lib/db";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";
import { redirect } from "next/navigation";

type SourceLibraryProps = { searchParams: Promise<{ added?: string; saved?: string; deleted?: string; generated?: string; count?: string; covers?: string; sourceError?: string }> };
export const metadata = { title: "Source library", robots: { index: false, follow: false } };

export default async function SourceLibraryPage({ searchParams }: SourceLibraryProps) {
  const userSession = await getUserFromSession();
  if (!userSession) redirect("/admin/login");

  await connectDatabase();
  const user = await User.findOne({ numericId: userSession.userId });
  if (!user || !user.isActive) redirect("/admin/login");

  const userSiteIds = new Set(user.domainRoles.map((dr: any) => dr.siteId));
  const allSites = await listSites();
  const sites = allSites.filter((s) => userSiteIds.has(s.id));

  const sources = await listSourceDocuments();
  const query = await searchParams;
  const scheduled = sources.filter((source) => source.scheduledAt).length;
  const unscheduled = sources.length - scheduled;

  return (
    <AdminShell>
      <div className="admin-page-heading">
        <div><nav className="admin-breadcrumb" aria-label="Breadcrumb"><Link href="/admin">Control room</Link><span aria-hidden="true">/</span><span>Sources</span></nav><h1>Source <em>library.</em></h1><p>Batch intake, rights, target sites, and publication schedules in one workspace.</p></div>
        <Link className="admin-text-link" href="/admin/content">View generated content →</Link>
      </div>
      {query.added && <p className="form-success" role="status">{query.added} source {query.added === "1" ? "item" : "items"} added to the library.</p>}
      {query.saved && <p className="form-success" role="status">Source changes saved.</p>}
      {query.deleted && <p className="form-success" role="status">Source and private PDF removed.</p>}
      {query.generated && <p className="form-success" role="status">Generated {query.count ?? "0"} draft {query.count === "1" ? "entry" : "entries"} for review; {query.covers ?? "0"} AI cover {query.covers === "1" ? "was" : "images were"} created. Review each before scheduling or publishing.</p>}
      {query.sourceError && <p className="form-error" role="alert">{query.sourceError}</p>}

      <div className="source-library-stats">
        <article><span>All sources</span><strong>{sources.length.toString().padStart(2, "0")}</strong></article>
        <article><span>Scheduled</span><strong>{scheduled.toString().padStart(2, "0")}</strong></article>
        <article><span>No schedule</span><strong>{unscheduled.toString().padStart(2, "0")}</strong></article>
      </div>

      <BulkSourceIntake
        sites={sites}
        reservedDates={sources.flatMap((source) => source.scheduledAt ? [new Date(source.scheduledAt).toISOString().slice(0, 10)] : [])}
      />

      <section className="source-library-list">
        <div className="source-library-list-heading"><div><p className="eyebrow">Manage intake</p><h2>All source PDFs &amp; links</h2></div><span>{sources.length} total</span></div>
        {sources.length === 0 ? (
          <div className="source-empty"><span aria-hidden="true">↥</span><h3>Your source library is ready</h3><p>Add PDFs or external links above. Set a schedule now or edit it later from this list.</p></div>
        ) : (
          <div className="source-record-list">{sources.map((source) => <SourceDocumentEditor key={source.id} source={source} sites={sites} />)}</div>
        )}
      </section>
    </AdminShell>
  );
}
