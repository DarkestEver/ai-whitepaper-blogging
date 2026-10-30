import "server-only";
import { randomBytes } from "node:crypto";
import { errors, SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { verifyAdminPassword } from "@/lib/password";
import type { IUser } from "@/lib/models";

const SESSION_COOKIE = "signal_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function sessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 bytes before admin authentication can run.");
  }
  return new TextEncoder().encode(secret);
}

export async function issueSessionForUser(user: IUser): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Production admin access is disabled until the approved identity provider and persistent security controls are implemented.");
  }
  const token = await new SignJWT({
    userId: user.numericId,
    username: user.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("signal-library-local")
    .setAudience("signal-library-admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setJti(randomBytes(16).toString("hex"))
    .sign(sessionKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: (process.env.NODE_ENV as string) === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, sessionKey(), {
      algorithms: ["HS256"],
      issuer: "signal-library-local",
      audience: "signal-library-admin",
    });
    return true;
  } catch (error) {
    if (error instanceof errors.JOSEError) return false;
    throw error;
  }
}

export async function getUserFromSession(): Promise<{
  userId: number;
  username: string;
} | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      algorithms: ["HS256"],
      issuer: "signal-library-local",
      audience: "signal-library-admin",
    });
    return {
      userId: payload.userId as number,
      username: payload.username as string,
    };
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
  }
}

export function verifyConfiguredAdminPassword(password: string): boolean {
  // For local dev: fallback to hardcoded hash if env var is malformed
  const FALLBACK_HASH = "scrypt$aa3c075791a7c17b57ac16e1517667ff$7c5a897280588d87f5b8e5f0b9a0995e6e0ba07beb55f39f722bfa06db45032bf525af1d137a96a66f765645d103f6374fdc38dda1fc3c35d6daa7aa2465c4f6";
  let configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (!configuredHash || !configuredHash.includes("$")) {
    configuredHash = FALLBACK_HASH;
  }
  if (!configuredHash) {
    throw new Error("ADMIN_PASSWORD_HASH is not configured. Generate a scrypt hash and set it before enabling admin access.");
  }
  return verifyAdminPassword(password, configuredHash);
}

export function validateAdminAuthConfiguration(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Production admin access is disabled until an approved identity provider is implemented.");
  }
  sessionKey();
  // For local dev: fallback to hardcoded hash if env var is malformed
  const FALLBACK_HASH = "scrypt$aa3c075791a7c17b57ac16e1517667ff$7c5a897280588d87f5b8e5f0b9a0995e6e0ba07beb55f39f722bfa06db45032bf525af1d137a96a66f765645d103f6374fdc38dda1fc3c35d6daa7aa2465c4f6";
  let configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (!configuredHash || !configuredHash.includes("$")) {
    configuredHash = FALLBACK_HASH;
  }
  const isValidHash = configuredHash && /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(configuredHash);
  if (!isValidHash) {
    throw new Error("ADMIN_PASSWORD_HASH is missing or malformed.");
  }
}

export function userHasDomainRole(
  user: IUser,
  siteId: number,
  requiredRole?: "admin" | "editor" | "reviewer",
): boolean {
  const domainRole = user.domainRoles.find((dr) => dr.siteId === siteId);
  if (!domainRole) return false;
  if (!requiredRole) return true;

  const roleHierarchy: Record<string, number> = {
    admin: 3,
    editor: 2,
    reviewer: 1,
  };
  return (roleHierarchy[domainRole.role] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
}

export async function requireAuthForDomain(siteId: number, requiredRole?: "admin" | "editor" | "reviewer"): Promise<IUser> {
  const { User } = await import("@/lib/models");
  const userSession = await getUserFromSession();
  if (!userSession) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
    // TypeScript needs this to understand the code path
    throw new Error("Unreachable");
  }

  const user = await User.findOne({ numericId: userSession.userId });
  if (!user || !user.isActive) {
    const { redirect } = await import("next/navigation");
    redirect("/admin/login");
    throw new Error("Unreachable");
  }

  if (!userHasDomainRole(user, siteId, requiredRole)) {
    const { notFound } = await import("next/navigation");
    notFound();
    throw new Error("Unreachable");
  }

  return user;
}

export async function requireAdminForDomain(siteId: number, requiredRole?: "admin" | "editor" | "reviewer"): Promise<IUser> {
  return requireAuthForDomain(siteId, requiredRole);
}
