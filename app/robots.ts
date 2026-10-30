import type { MetadataRoute } from "next";
import { getRequestSite } from "@/lib/request-site";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getRequestSite();
  if (!site || !site.indexingEnabled) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: site.publicUrl ? `${site.publicUrl}/sitemap.xml` : undefined,
  };
}
