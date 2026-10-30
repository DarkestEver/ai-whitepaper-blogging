import { NextRequest, NextResponse } from "next/server";
import { isSameOriginPost } from "@/lib/admin-http";
import { clearAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  await clearAdminSession();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
