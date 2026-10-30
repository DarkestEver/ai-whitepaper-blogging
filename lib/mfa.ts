import { createHmac } from "node:crypto";

// Simple TOTP implementation for MFA
export function generateTOTP(secret: string, timeStep: number = 30): string {
  const now = Math.floor(Date.now() / 1000 / timeStep);
  const timeBytes = Buffer.alloc(8);
  timeBytes.writeBigInt64BE(BigInt(now), 0);

  const secretBuffer = Buffer.from(secret, "base64");
  const hmac = createHmac("sha1", secretBuffer);
  hmac.update(timeBytes);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const code =
    (((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)) %
    1000000;

  return code.toString().padStart(6, "0");
}

export function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  const now = Math.floor(Date.now() / 1000 / 30);

  for (let i = -window; i <= window; i++) {
    const timeBytes = Buffer.alloc(8);
    timeBytes.writeBigInt64BE(BigInt(now + i), 0);

    const secretBuffer = Buffer.from(secret, "base64");
    const hmac = createHmac("sha1", secretBuffer);
    hmac.update(timeBytes);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0xf;
    const code =
      (((digest[offset] & 0x7f) << 24) |
        ((digest[offset + 1] & 0xff) << 16) |
        ((digest[offset + 2] & 0xff) << 8) |
        (digest[offset + 3] & 0xff)) %
      1000000;

    if (code.toString().padStart(6, "0") === token) {
      return true;
    }
  }

  return false;
}

export function generateMFASetupURL(username: string, secret: string, issuer: string = "Signal Library"): string {
  const label = encodeURIComponent(`${issuer}:${username}`);
  const params = [
    `secret=${secret}`,
    `issuer=${encodeURIComponent(issuer)}`,
    `algorithm=SHA1`,
    `digits=6`,
    `period=30`,
  ];
  return `otpauth://totp/${label}?${params.join("&")}`;
}
