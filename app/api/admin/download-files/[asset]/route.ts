import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { readDownloadPdf } from "@/lib/media";

export async function GET(_request: NextRequest, context: { params: Promise<{ asset: string }> }) {
  await requireAdmin();
  const { asset } = await context.params;
  const bytes = await readDownloadPdf(asset);
  if (!bytes) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(bytes as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="download-${asset}"`, "Cache-Control": "private, no-store" } });
}
