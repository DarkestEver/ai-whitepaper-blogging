import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

export async function encryptFile(data: Buffer, password: string): Promise<Buffer> {
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(password, salt, 32);
  const iv = randomBytes(12);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Format: salt (16) + iv (12) + tag (16) + encrypted data
  return Buffer.concat([salt, iv, tag, encrypted]);
}

export async function decryptFile(encryptedData: Buffer, password: string): Promise<Buffer> {
  if (encryptedData.length < SALT_LENGTH + 12 + TAG_LENGTH) {
    throw new Error("Invalid encrypted file format");
  }

  const salt = encryptedData.slice(0, SALT_LENGTH);
  const iv = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + 12);
  const tag = encryptedData.slice(SALT_LENGTH + 12, SALT_LENGTH + 12 + TAG_LENGTH);
  const encrypted = encryptedData.slice(SALT_LENGTH + 12 + TAG_LENGTH);

  const key = scryptSync(password, salt, 32);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  try {
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  } catch (error) {
    throw new Error("Failed to decrypt file: invalid password or corrupted data");
  }
}
