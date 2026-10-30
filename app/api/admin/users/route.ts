import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession, userHasDomainRole } from "@/lib/auth";
import { isSameOriginPost, safeErrorResponse } from "@/lib/admin-http";
import { listSites } from "@/lib/db";
import { User, nextId } from "@/lib/models";
import { connectDatabase } from "@/lib/mongodb";
import { hashAdminPassword } from "@/lib/password";
import { z } from "zod";

const CreateUserSchema = z.object({
  username: z.string().min(3).max(255),
  password: z.string().min(8).max(1024),
});

export async function POST(request: NextRequest) {
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

  // Only users with admin role on ANY site can create users
  const isAdmin = sessionUser.domainRoles.some((dr: any) => dr.role === "admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "You do not have permission to manage users." }, { status: 403 });
  }

  const form = await request.formData();
  const parsed = CreateUserSchema.safeParse({
    username: form.get("username"),
    password: form.get("password"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 400 });
  }

  try {
    // Check if username already exists
    const existing = await User.findOne({ username: parsed.data.username });
    if (existing) {
      return NextResponse.json({ error: "Username already exists." }, { status: 409 });
    }

    // Get sites and build domain roles from form
    const sites = await listSites();
    const domainRoles = [];

    for (const site of sites) {
      const roleValue = form.get(`role-${site.id}`);
      if (roleValue && roleValue !== "none") {
        domainRoles.push({
          siteId: site.id,
          role: roleValue as "admin" | "editor" | "reviewer",
        });
      }
    }

    // Create new user
    const newUser = new User({
      numericId: await nextId("user"),
      username: parsed.data.username,
      passwordHash: hashAdminPassword(parsed.data.password),
      mfaSecret: "",
      domainRoles,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await newUser.save();

    return NextResponse.redirect(new URL("/admin/users?created=1", request.url), 303);
  } catch (error) {
    const response = safeErrorResponse(error);
    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
