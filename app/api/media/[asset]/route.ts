import { NextRequest, NextResponse } from "next/server";
import { readCoverImage } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ asset: string }> }) {
  const { asset } = await context.params;
  const image = await readCoverImage(asset);
  if (!image) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(image.bytes), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(image.bytes.byteLength),
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Content-Type": image.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
