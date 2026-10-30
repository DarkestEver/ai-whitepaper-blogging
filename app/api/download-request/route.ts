import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findWhitepaperById } from "@/lib/db";
import { getRequestSite } from "@/lib/request-site";
import { registerReaderLead } from "@/lib/reader-leads";
import { sendDownloadVerificationEmail } from "@/lib/email";
import { isSiteDownloadReady } from "@/lib/site-readiness";

const requestSchema = z.object({ paperId: z.coerce.number().int().positive(), firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), email: z.string().trim().email().max(254), company: z.string().trim().max(160).default(""), privacyAccepted: z.literal("yes"), marketingAccepted: z.literal("yes").optional() });

export async function POST(request: NextRequest) {
  const site = await getRequestSite();
  if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });
  if (!isSiteDownloadReady(site)) return NextResponse.json({ error: "Reader downloads are not enabled for this domain. Complete the production-readiness checklist first." }, { status: 503 });
  const form = await request.formData();
  const parsed = requestSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Complete the required fields and accept the privacy policy." }, { status: 400 });
  const paper = await findWhitepaperById(parsed.data.paperId);
  if (!paper || paper.siteId !== site.id || paper.status !== "published" || !paper.downloadablePdfAsset) return NextResponse.json({ error: "This PDF is not available for download." }, { status: 404 });
  try {
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const lead = await registerReaderLead({ siteId: site.id, paperId: paper.id, email: parsed.data.email, firstName: parsed.data.firstName, lastName: parsed.data.lastName, company: parsed.data.company, marketingConsent: parsed.data.marketingAccepted === "yes", userAgent: request.headers.get("user-agent") || "", ipAddress: ip });
    const verificationUrl = new URL(`/download/verify?token=${encodeURIComponent(lead.token)}`, request.url).toString();
    await sendDownloadVerificationEmail(site, { to: parsed.data.email, firstName: parsed.data.firstName, siteName: site.name, verificationUrl });
    return NextResponse.json({ message: "Check your email to verify your address and download the PDF." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Email delivery failed." }, { status: 503 });
  }
}
