import Link from "next/link";
import { AdminShell, StatusPill } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { getSite } from "@/lib/db";
import { connectDatabase } from "@/lib/mongodb";
import { ReaderLead } from "@/lib/models";

export const metadata = { title: "Leads and downloads", robots: { index: false, follow: false } };
export default async function LeadsPage() {
  await requireAdmin(); const site = await getSite(); await connectDatabase();
  const leads = await ReaderLead.find({ siteId: site.id }).sort({ createdAt: -1 }).limit(100).lean();
  return <AdminShell><div className="admin-page-heading"><div><nav className="admin-breadcrumb" aria-label="Breadcrumb"><Link href={`/admin/sites/${site.id}`}>Domain management</Link><span aria-hidden="true">/</span><span>Leads and downloads</span></nav><h1>Leads &amp; <em>downloads.</em></h1><p>Site-scoped reader requests, verification, consent, and download activity.</p></div><StatusPill status={process.env.EMAIL_API_URL ? "configured" : "not_configured"} /></div><section className="admin-panel admin-recent"><div className="admin-panel-heading"><div><p className="eyebrow">Reader requests</p><h2>{leads.length} records</h2></div></div>{leads.length === 0 ? <p className="admin-body-copy">No reader leads exist for this domain. Public downloads require a separate approved PDF asset and configured email delivery.</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Email</th><th>Name</th><th>Verified</th><th>Consent</th><th>Downloads</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.numericId}><td>{lead.email}</td><td>{lead.firstName} {lead.lastName}</td><td>{lead.isVerified ? "Yes" : "No"}</td><td>{lead.consentStatus}</td><td>{lead.downloadCount}</td></tr>)}</tbody></table></div>}</section></AdminShell>;
}
