import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession, userHasDomainRole } from "@/lib/auth";
import { readSourcePdf } from "@/lib/media";
import { SourceDocument, User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ asset: string }> }) {
  await connectDatabase();

  // Verify authentication
  const userSession = await getUserFromSession();
  if (!userSession) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const sessionUser = await User.findOne({ numericId: userSession.userId });
  if (!sessionUser || !sessionUser.isActive) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { asset } = await context.params;

  // Find the source document by asset identifier
  const source = await SourceDocument.findOne({ sourceAsset: `/api/admin/source-files/${asset}` });
  if (!source) {
    return new NextResponse(null, { status: 404 });
  }

  // Verify user has access to this source's site
  const hasAccess = userHasDomainRole(sessionUser, source.siteId);
  if (!hasAccess) {
    return NextResponse.json({ error: "You do not have access to this resource." }, { status: 403 });
  }

  const pdf = await readSourcePdf(asset);
  if (!pdf) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": 'attachment; filename="source-document.pdf"',
      "Content-Length": String(pdf.byteLength),
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
