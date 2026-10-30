import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashAdminPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

export function verifyAdminPassword(password: string, storedHash: string): boolean {
  const [algorithm, salt, expectedHex, extra] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex || extra) return false;
  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== 64) return false;
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return verifyAdminPassword(password, storedHash);
}
