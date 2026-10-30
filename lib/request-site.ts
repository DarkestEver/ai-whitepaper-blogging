import { headers } from "next/headers";
import { cookies } from "next/headers";
import { resolveSiteForHost, findSiteById } from "@/lib/db";

export async function getRequestSite() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");

  // On localhost, allow a __dev_site cookie to select which site to preview
  if (host) {
    let hostname: string;
    try {
      hostname = new URL(`http://${host}`).hostname.toLowerCase();
    } catch {
      hostname = "";
    }
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(hostname);
    if (isLocal) {
      const cookieStore = await cookies();
      const devSiteId = cookieStore.get("__dev_site")?.value;
      if (devSiteId) {
        const siteId = Number(devSiteId);
        if (Number.isSafeInteger(siteId) && siteId > 0) {
          const site = await findSiteById(siteId);
          if (site) return site;
        }
      }
    }
  }

  return await resolveSiteForHost(host);
}
