import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getSite, listLocalAuditEvents, listWhitepapers } from "@/lib/db";
import { themePresets } from "@/lib/themes";
import { formatRelativeTime } from "@/lib/time-utils";

export const metadata = { title: "Admin overview", robots: { index: false, follow: false } };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const site = await getSite();
  const papers = await listWhitepapers({ includeNonPublic: true });
  const counts = {
    published: papers.filter((paper) => paper.status === "published").length,
    draft: papers.filter((paper) => paper.status === "draft").length,
    inReview: papers.filter((paper) => paper.editorialStatus === "in_review").length,
    scheduled: papers.filter((paper) => paper.status === "scheduled").length,
    archived: papers.filter((paper) => paper.status === "archived").length,
  };
  const preset = themePresets.find((item) => item.id === site.themeId);
  const auditEvents = await listLocalAuditEvents(5);

  return (
    <AdminShell>
      <div className="admin-page-heading">
        <div><nav className="admin-breadcrumb" aria-label="Breadcrumb"><Link href="/admin">Control room</Link><span aria-hidden="true">/</span><span>Overview</span></nav><h1>Good work starts <em>with a clear view.</em></h1><p>Manage the local sample library. Production services remain disabled.</p></div>
        <span className="prototype-badge">Prototype only</span>
      </div>
      <div className="admin-stat-grid">
        <article className="admin-stat"><span>Library entries</span><strong>{papers.length.toString().padStart(2, "0")}</strong><small>MongoDB records</small></article>
        <article className="admin-stat"><span>Published samples</span><strong>{counts.published.toString().padStart(2, "0")}</strong><small>Visible in public prototype</small></article>
        <article className="admin-stat"><span>Drafts</span><strong>{counts.draft.toString().padStart(2, "0")}</strong><small>Not publicly rendered</small></article>
        <article className="admin-stat"><span>In editorial review</span><strong>{counts.inReview.toString().padStart(2, "0")}</strong><small>Awaiting an explicit decision</small></article>
        <article className="admin-stat"><span>Scheduled</span><strong>{counts.scheduled.toString().padStart(2, "0")}</strong><small>Rights-cleared · awaiting due time</small></article>
        <article className="admin-stat"><span>Theme presets</span><strong>{themePresets.length.toString().padStart(2, "0")}</strong><small>Preview-only draft catalog</small></article>
      </div>
      <div className="admin-content-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading"><div><p className="eyebrow">Current site</p><h2>{site.name}</h2></div><Link className="admin-text-link" href={`/admin/sites/${site.id}`}>Manage this domain →</Link></div>
          <p className="admin-body-copy">{site.description}</p>
          <div className="site-config-summary"><span>Configured public URL</span><strong>{site.publicUrl || "Not configured"}</strong><span>Selected preset</span><strong>{preset?.name ?? site.themeId}</strong><span>Preset lifecycle</span><StatusPill status={preset?.status ?? "missing"} /></div>
        </section>
        <section className="admin-panel">
          <p className="eyebrow">Not connected</p>
          <h2>Production workflow status</h2>
          <p className="admin-body-copy">The local source library supports batch PDF/link intake, page-aware text extraction, optional provider-backed draft generation, and per-source schedules. A local editorial review gate protects scheduling and publication. Independent reviewer roles, OCR, malware scanning, real multi-domain publishing, and reliable background scheduling remain pending.</p>
          <Link className="admin-text-link" href="/admin/integrations">Review integration status →</Link>
        </section>
      </div>
      <section className="admin-panel admin-recent">
        <div className="admin-panel-heading"><div><p className="eyebrow">Latest changes</p><h2>Catalog records</h2></div><Link className="button button-dark" href="/admin/content/new">New entry <span aria-hidden="true">+</span></Link></div>
        <div className="admin-table-wrap">
          <table className="admin-table"><thead><tr><th>Title</th><th>Topic</th><th>Status</th><th>Updated</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>{papers.slice(0, 6).map((paper) => <tr key={paper.id}><td><Link href={`/admin/content/${paper.id}`}>{paper.title}</Link></td><td>{paper.category}</td><td><StatusPill status={paper.status} /></td><td><span title={new Date(paper.updatedAt).toLocaleString()}>{formatRelativeTime(paper.updatedAt)}</span></td><td><Link aria-label={`Edit ${paper.title}`} href={`/admin/content/${paper.id}`}>Edit →</Link></td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="admin-panel admin-recent">
        <div className="admin-panel-heading"><div><p className="eyebrow">Local audit trail</p><h2>Recent admin actions</h2></div></div>
        {auditEvents.length === 0 ? <p className="admin-body-copy">No changes recorded yet.</p> : (
          <div className="audit-list">{auditEvents.map((event) => <div className="audit-item" key={event.id}><span className="audit-action">{event.action}</span><span>{event.entity} · {event.entityId}</span><time dateTime={event.occurredAt} title={new Date(event.occurredAt).toLocaleString()}>{formatRelativeTime(event.occurredAt)}</time></div>)}</div>
        )}
      </section>
    </AdminShell>
  );
}
