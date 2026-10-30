import { NextRequest, NextResponse } from "next/server";
import { getRequestSite } from "@/lib/request-site";
import { unsubscribeFromNewsletter } from "@/lib/reader-newsletter";

export async function GET(request: NextRequest) {
  const site = await getRequestSite();
  if (!site) return NextResponse.json({ error: "Site not found." }, { status: 404 });

  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing unsubscribe token." }, { status: 400 });

  try {
    await unsubscribeFromNewsletter({ siteId: site.id, unsubscribeToken: token });
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Unsubscribed</title></head><body style="font-family:sans-serif;text-align:center;padding:60px 20px"><h1>You have been unsubscribed</h1><p>You will no longer receive newsletter emails from this site.</p><a href="/">Return to homepage</a></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unsubscribe failed." }, { status: 400 });
  }
}
