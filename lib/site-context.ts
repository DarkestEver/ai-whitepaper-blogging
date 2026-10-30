import type { SiteRecord } from "@/lib/db";

export function formatSiteEditorialContext(site: Pick<SiteRecord, "name" | "description" | "publicUrl">): string {
  const domain = site.publicUrl ? new URL(site.publicUrl).hostname : "not configured";
  const publicUrl = site.publicUrl || "not configured (local prototype)";
  return `Name: ${site.name}
Domain: ${domain}
Public base URL: ${publicUrl}
Editorial description: ${site.description}`;
}
