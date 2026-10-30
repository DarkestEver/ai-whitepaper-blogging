import { NextRequest, NextResponse } from "next/server";
import { requireAdminForDomain } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import {
  approveWhitepaperReview,
  findWhitepaperById,
  requestWhitepaperChanges,
  submitWhitepaperForReview,
} from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };
type ReviewAction = "submit" | "approve" | "request_changes";

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isSameOriginPost(request))) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid content identifier." }, { status: 400 });
  }

  const existing = await findWhitepaperById(id);
  if (!existing) return NextResponse.json({ error: "Content was not found." }, { status: 404 });

  await requireAdminForDomain(existing.siteId, "reviewer");

  try {
    const form = await request.formData();
    const action = form.get("action");
    let result;
    if (action === "submit") {
      result = await submitWhitepaperForReview(id);
    } else if (action === "approve") {
      result = await approveWhitepaperReview(id);
    } else if (action === "request_changes") {
      const note = form.get("note");
      if (typeof note !== "string") {
        return NextResponse.json({ error: "A text review note is required." }, { status: 400 });
      }
      result = await requestWhitepaperChanges(id, note);
    } else {
      return NextResponse.json({ error: "Choose a valid editorial review action." }, { status: 400 });
    }
    return NextResponse.redirect(new URL(`/admin/content/${result.id}?review=${action}`, request.url), 303);
  } catch (error) {
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
