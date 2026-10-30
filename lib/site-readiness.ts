import type { SiteRecord } from "@/lib/db";
export type ReadinessCheck = { name: string; ready: boolean; detail: string };
export function getSiteReadiness(site: SiteRecord): ReadinessCheck[] { const secretReady = Boolean(site.emailSecretRef && process.env[site.emailSecretRef]?.trim()); return [
  { name: "HTTPS public URL", ready: site.publicUrl.startsWith("https://"), detail: site.publicUrl || "Configure an HTTPS origin." },
  { name: "Contact identity", ready: Boolean(site.legalName && site.contactEmail), detail: "Legal name and contact email are required." },
  { name: "Privacy policy approval", ready: site.privacyApproved && Boolean(site.privacyPolicy.trim()), detail: "Add the approved privacy notice and record approval." },
  { name: "Terms approval", ready: site.termsApproved && Boolean(site.termsOfUse.trim()), detail: "Add approved terms and record approval." },
  { name: "Email delivery", ready: site.emailEnabled && site.emailApproved && Boolean(site.emailProvider && site.emailApiUrl && site.emailFromEmail && secretReady), detail: "Configure this domain's provider, sender, approval, and secret reference." },
  { name: "Distributed rate limiting", ready: Boolean(process.env.RATE_LIMIT_STORE_URL), detail: "Configure the approved shared rate-limit store before public lead capture." },
  { name: "Private production storage", ready: Boolean(process.env.PRIVATE_OBJECT_STORAGE_URL), detail: "Configure private object storage and malware scanning." },
  { name: "Download launch switch", ready: site.downloadEnabled, detail: "Enable only after all required checks pass." },
]; }
export function isSiteDownloadReady(site: SiteRecord): boolean { return getSiteReadiness(site).every((check) => check.ready); }
