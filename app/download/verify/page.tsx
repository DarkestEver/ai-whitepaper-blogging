import Link from "next/link";
import { getRequestSite } from "@/lib/request-site";
import { verifyLeadEmail, acceptConsent, canDownloadContent } from "@/lib/reader-leads";
import { findWhitepaperById } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function VerifyDownloadPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const site = await getRequestSite(); const { token } = await searchParams;
  if (!site || !token) return <main className="detail-main"><h1>Verification link is invalid</h1></main>;
  const lead = await verifyLeadEmail(token);
  if (!lead) return <main className="detail-main"><h1>Verification link expired</h1><p>Request a new download link.</p></main>;
  await acceptConsent(lead.leadId);
  const details = await (await import("@/lib/reader-leads")).getLeadDetails(lead.leadId);
  const paper = details ? await findWhitepaperById(details.paperId) : undefined;
  if (!paper || paper.siteId !== site.id || !(await canDownloadContent(lead.leadId))) return <main className="detail-main"><h1>Download is unavailable</h1></main>;
  return <main className="detail-main"><p className="eyebrow">Email verified</p><h1>Your download is ready.</h1><p>{paper.title}</p><Link className="button button-dark" href={`/api/download/${paper.id}?lead=${lead.leadId}`}>Download PDF</Link></main>;
}
