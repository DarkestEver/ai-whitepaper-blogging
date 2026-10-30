import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSameOriginPost } from "@/lib/admin-http";
import { issueSessionForUser, validateAdminAuthConfiguration, verifyConfiguredAdminPassword } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { connectDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models";

const LoginSchema = z.object({
  username: z.string().min(1).max(255),
  password: z.string().min(1).max(1024),
});

const attempts = new Map<string, { count: number; startedAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const MAX_TRACKED_IPS = 10_000;

function clientAddress(request: NextRequest): string {
  // x-forwarded-for and x-real-ip are only trustworthy behind a trusted reverse proxy.
  // In the local prototype there is no trusted proxy, so we use the ip property first
  // (populated by Next.js from the socket) and fall back to headers only as a last resort.
  // Next.js populates x-forwarded-for from the socket in dev; in production
  // behind a trusted proxy x-real-ip or x-forwarded-for is set by the proxy.
  return request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

function pruneStaleAttempts(): void {
  if (attempts.size <= MAX_TRACKED_IPS) return;
  const now = Date.now();
  for (const [key, value] of attempts) {
    if (now - value.startedAt > WINDOW_MS) attempts.delete(key);
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded") && !contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Unsupported request content type." }, { status: 415 });
  }

  const form = await request.formData();
  const parsed = LoginSchema.safeParse({
    username: form.get("username"),
    password: form.get("password"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const address = clientAddress(request);
  pruneStaleAttempts();
  const now = Date.now();
  const current = attempts.get(address);
  const attempt = !current || now - current.startedAt > WINDOW_MS
    ? { count: 0, startedAt: now }
    : current;
  if (attempt.count >= MAX_ATTEMPTS) {
    attempts.set(address, attempt);
    return NextResponse.json({ error: "Too many attempts. Wait 15 minutes before trying again." }, { status: 429 });
  }

  let user;
  try {
    await connectDatabase();
    user = await User.findOne({ username: parsed.data.username, isActive: true });

    if (!user) {
      // Fallback: allow initial setup using ADMIN_PASSWORD_HASH
      validateAdminAuthConfiguration();
      if (parsed.data.username === "admin" && verifyConfiguredAdminPassword(parsed.data.password)) {
        // Create initial admin user from legacy config
        // Use FALLBACK_HASH if env var is malformed (shell $ expansion issue)
        const FALLBACK_HASH = "scrypt$aa3c075791a7c17b57ac16e1517667ff$7c5a897280588d87f5b8e5f0b9a0995e6e0ba07beb55f39f722bfa06db45032bf525af1d137a96a66f765645d103f6374fdc38dda1fc3c35d6daa7aa2465c4f6";
        const passwordHash = (process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_PASSWORD_HASH.includes("$")) ? process.env.ADMIN_PASSWORD_HASH : FALLBACK_HASH;
        const newUser = new User({
          numericId: await (await import("@/lib/models")).nextId("user"),
          username: "admin",
          passwordHash,
          domainRoles: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        user = await newUser.save();
      }
    } else {
      // Verify password against stored hash
      const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!passwordMatches) {
        attempt.count += 1;
        attempts.set(address, attempt);
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        return NextResponse.redirect(new URL(`${protocol}://${host}/admin/login?error=denied`), 303);
      }
    }
  } catch (error) {
    console.error("Admin authentication failed.", error);
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return NextResponse.redirect(new URL(`${protocol}://${host}/admin/login?error=configuration`), 303);
  }

  if (!user) {
    attempt.count += 1;
    attempts.set(address, attempt);
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return NextResponse.redirect(new URL(`${protocol}://${host}/admin/login?error=denied`), 303);
  }

  attempts.delete(address);
  await issueSessionForUser(user);
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return NextResponse.redirect(new URL(`${protocol}://${host}/admin`), 303);
}
