import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isSameOriginPost(request))) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  await connectDatabase();

  // Get authenticated user and verify admin role
  const userSession = await getUserFromSession();
  if (!userSession) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const sessionUser = await User.findOne({ numericId: userSession.userId });
  if (!sessionUser || !sessionUser.isActive) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  // Only users with admin role on ANY site can delete users
  const isAdmin = sessionUser.domainRoles.some((dr: any) => dr.role === "admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "You do not have permission to manage users." }, { status: 403 });
  }

  const { id: rawId } = await context.params;
  const userId = Number(rawId);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return NextResponse.json({ error: "Invalid user identifier." }, { status: 400 });
  }

  try {
    const user = await User.findOne({ numericId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await User.deleteOne({ numericId: userId });

    return NextResponse.redirect(new URL("/admin/users?deleted=1", request.url), 303);
  } catch (error) {
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
