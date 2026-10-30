import { FeatureUnavailableError } from "@/lib/admin-http";
import type { SiteRecord } from "@/lib/db";

export async function sendDownloadVerificationEmail(site: Pick<SiteRecord, "name" | "emailEnabled" | "emailProvider" | "emailApiUrl" | "emailSecretRef" | "emailFromEmail" | "emailFromName" | "emailReplyTo">, input: { to: string; firstName: string; siteName: string; verificationUrl: string }): Promise<void> {
  const provider = site.emailProvider.trim();
  const endpoint = site.emailApiUrl.trim();
  const token = site.emailSecretRef ? process.env[site.emailSecretRef]?.trim() : "";
  if (!site.emailEnabled || !provider || !endpoint || !token || !site.emailFromEmail) throw new FeatureUnavailableError("This domain's approved email delivery is not configured.");
  const response = await fetch(endpoint, { method: "POST", redirect: "error", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ provider, to: input.to, template: "download-verification", firstName: input.firstName, siteName: input.siteName, verificationUrl: input.verificationUrl, from: { email: site.emailFromEmail, name: site.emailFromName || site.name }, replyTo: site.emailReplyTo || site.emailFromEmail }) });
  if (!response.ok) throw new Error(`Email delivery provider returned HTTP ${response.status}.`);
}
