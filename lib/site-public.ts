import type { SiteRecord } from "@/lib/db";

export function siteBaseUrl(site: SiteRecord): string {
  return site.publicUrl || "http://localhost:3000";
}

export function absoluteSiteUrl(site: SiteRecord, path: string): string {
  return new URL(path, siteBaseUrl(site)).toString();
}

export function renderPolicyText(value: string, fallback: string): string[] {
  const text = value.trim() || fallback;
  return text.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}
