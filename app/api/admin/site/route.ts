import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import { siteInputSchema, updateSite } from "@/lib/db";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  if (!(await isSameOriginPost(request))) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  await connectDatabase();
  const form = await request.formData();
  const siteIdValue = Number(form.get("siteId"));
  const siteId = Number.isSafeInteger(siteIdValue) && siteIdValue > 0 ? siteIdValue : undefined;
  if (!siteId) {
    return NextResponse.json({ error: "Choose a valid registered site." }, { status: 400 });
  }

  const userSession = await getUserFromSession();
  if (!userSession) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const user = await User.findOne({ numericId: userSession.userId });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }
  const templateConfig: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (key.startsWith("tc_") && typeof value === "string") {
      templateConfig[key.slice(3)] = value;
    }
  }
  const input = siteInputSchema.safeParse({
    name: form.get("name"),
    slug: form.get("slug"),
    description: form.get("description"),
    themeId: form.get("themeId"),
    templateId: form.get("templateId") ?? "default",
    templateConfig,
    publicUrl: form.get("publicUrl") ?? "",
    tagline: form.get("tagline") ?? "", logoUrl: form.get("logoUrl") ?? "", faviconUrl: form.get("faviconUrl") ?? "",
    brandColor: form.get("brandColor") ?? "#1f2937", accentColor: form.get("accentColor") ?? "#c8ec6d",
    contactEmail: form.get("contactEmail") ?? "", contactPhone: form.get("contactPhone") ?? "", contactAddress: form.get("contactAddress") ?? "", legalName: form.get("legalName") ?? "",
    privacyPolicy: form.get("privacyPolicy") ?? "", termsOfUse: form.get("termsOfUse") ?? "", cookiePolicy: form.get("cookiePolicy") ?? "", disclaimer: form.get("disclaimer") ?? "", editorialPolicy: form.get("editorialPolicy") ?? "", accessibilityStatement: form.get("accessibilityStatement") ?? "",
    indexingEnabled: form.get("indexingEnabled") === "on", socialLinks: [],
    emailEnabled: form.get("emailEnabled") === "on", emailProvider: form.get("emailProvider") ?? "", emailApiUrl: form.get("emailApiUrl") ?? "", emailSecretRef: form.get("emailSecretRef") ?? "", emailFromEmail: form.get("emailFromEmail") ?? "", emailFromName: form.get("emailFromName") ?? "", emailReplyTo: form.get("emailReplyTo") ?? "",
    emailApproved: form.get("emailApproved") === "on", privacyApproved: form.get("privacyApproved") === "on", termsApproved: form.get("termsApproved") === "on", downloadEnabled: form.get("downloadEnabled") === "on", leadRetentionDays: form.get("leadRetentionDays") ?? 90, verificationTokenMinutes: form.get("verificationTokenMinutes") ?? 60, downloadRateLimitPerHour: form.get("downloadRateLimitPerHour") ?? 10, maxDownloadsPerLead: form.get("maxDownloadsPerLead") ?? 3,
  });
  if (!input.success) {
    return NextResponse.json({ error: input.error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
  }
  try {
    const site = await updateSite(input.data, siteId);
    return NextResponse.redirect(new URL(`/admin/sites?site=${site.id}&saved=1`, request.url), 303);
  } catch (error) {
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
