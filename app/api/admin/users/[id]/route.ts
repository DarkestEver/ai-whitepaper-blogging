import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import { listSites } from "@/lib/db";
import { User } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";
import { hashAdminPassword } from "@/lib/password";

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

  // Only users with admin role on ANY site can edit users
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

    const form = await request.formData();
    const password = form.get("password");
    const isActive = form.get("isActive") === "on";

    // Update password if provided
    if (password && typeof password === "string" && password.length >= 8) {
      user.passwordHash = hashAdminPassword(password);
    }

    user.isActive = isActive;

    // Get sites and rebuild domain roles
    const sites = await listSites();
    const newDomainRoles = [];

    for (const site of sites) {
      const roleValue = form.get(`role-${site.id}`);
      if (roleValue && roleValue !== "none") {
        newDomainRoles.push({
          siteId: site.id,
          role: roleValue as "admin" | "editor" | "reviewer",
        });
      }
    }

    user.domainRoles = newDomainRoles;
    user.updatedAt = new Date().toISOString();

    await user.save();

    return NextResponse.redirect(new URL(`/admin/users/${userId}?saved=1`, request.url), 303);
  } catch (error) {
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
