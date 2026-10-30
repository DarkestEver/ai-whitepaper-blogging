import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import { createSite, listSites, siteInputSchema } from "@/lib/db";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  if (!(await isSameOriginPost(request))) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  await connectDatabase();

  // Get authenticated user and verify admin role
  const userSession = await getUserFromSession();
  if (!userSession) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const sessionUser = await User.findOne({ numericId: userSession.userId });
  if (!sessionUser || !sessionUser.isActive) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // Allow site creation if user has admin role on ANY site, or if user is the initial admin (created from ADMIN_PASSWORD_HASH)
  const hasAdminRole = sessionUser.domainRoles.some((dr: any) => dr.role === "admin");
  const isInitialAdmin = sessionUser.numericId === 1 && sessionUser.username === "admin";

  if (!hasAdminRole && !isInitialAdmin) {
    return NextResponse.json({ error: "You do not have permission to create sites." }, { status: 403 });
  }
  const form = await request.formData();
  const input = siteInputSchema.safeParse({
    name: form.get("name"),
    slug: form.get("slug"),
    description: form.get("description"),
    themeId: form.get("themeId"),
    templateId: form.get("templateId") ?? "default",
    publicUrl: form.get("publicUrl") ?? "",
    tagline: "", logoUrl: "", faviconUrl: "", brandColor: "#1f2937", accentColor: "#c8ec6d", contactEmail: "", contactPhone: "", contactAddress: "", legalName: "", privacyPolicy: "", termsOfUse: "", cookiePolicy: "", disclaimer: "", editorialPolicy: "", accessibilityStatement: "", indexingEnabled: false, socialLinks: [], emailEnabled: false, emailProvider: "", emailApiUrl: "", emailSecretRef: "", emailFromEmail: "", emailFromName: "", emailReplyTo: "", emailApproved: false, privacyApproved: false, termsApproved: false, downloadEnabled: false, leadRetentionDays: 90, verificationTokenMinutes: 60, downloadRateLimitPerHour: 10, maxDownloadsPerLead: 3,
  });
  if (!input.success) {
    return NextResponse.json({ error: input.error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
  }
  try {
    const site = await createSite(input.data);
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return NextResponse.redirect(new URL(`${protocol}://${host}/admin/sites?site=${site.id}&created=1`), 303);
  } catch (error) {
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
