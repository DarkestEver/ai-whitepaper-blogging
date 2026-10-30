import { randomBytes, scryptSync } from "node:crypto";

async function main(): Promise<void> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const password = Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
  if (password.length < 14) {
    throw new Error("Admin password must contain at least 14 characters.");
  }
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  process.stdout.write(`scrypt$${salt}$${digest}\n`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Password hash generation failed.");
  process.exitCode = 1;
});
