import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getSite } from "@/lib/db";

export const metadata = { title: "Manage domain", robots: { index: false, follow: false } };

export default async function ManageDomainPage() {
  await requireAdmin();
  const site = await getSite();
  const areas = [["Identity & branding", "Logo, favicon, colors, publisher identity, contact details, and legal pages.", `/admin/sites?site=${site.id}`], ["Content & editorial", "Create, edit, review, schedule, and publish site-scoped content.", "/admin/content"], ["Sources & AI drafts", "Upload approved source PDFs, generate drafts, and review evidence.", "/admin/sources"], ["SEO & discovery", "Sitemap, RSS, robots, llms.txt, canonical URLs, and indexing readiness.", "/admin/integrations"], ["Leads & downloads", "Public forms, consent, verification email, protected PDF assets, and lead retention.", "/admin/leads"], ["Integrations", "AI, email, object storage, analytics, WordPress, and operations.", "/admin/integrations"]] as const;
  return <AdminShell><div className="admin-page-heading"><div><nav className="admin-breadcrumb" aria-label="Breadcrumb"><Link href="/admin">Control room</Link><span aria-hidden="true">/</span><span>Domain management</span></nav><h1>Manage <em>{site.name}.</em></h1><p>Everything for this domain starts here. Complete each area before production approval.</p></div><StatusPill status={site.publicUrl ? "configured" : "not_configured"} /></div><section className="admin-panel admin-recent"><div className="admin-panel-heading"><div><p className="eyebrow">Domain readiness</p><h2>{site.publicUrl || "Public URL not configured"}</h2></div><Link className="button button-dark" href={`/admin/sites?site=${site.id}`}>Edit domain settings</Link></div><div className="admin-card-grid">{areas.map(([title, description, href]) => <article className="admin-panel" key={title}><p className="eyebrow">Domain area</p><h2>{title}</h2><p className="admin-body-copy">{description}</p><Link className="admin-text-link" href={href}>Open {title.toLowerCase()} →</Link></article>)}</div></section><section className="prototype-callout"><strong>Download workflow status</strong><span>Public lead capture and protected PDF delivery are not active yet. Private source PDFs must never be reused as public downloads without an approved downloadable asset and email provider.</span></section></AdminShell>;
}
