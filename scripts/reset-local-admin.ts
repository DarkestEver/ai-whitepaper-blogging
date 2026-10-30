import { randomBytes, scryptSync } from "node:crypto";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const database = process.env.MONGODB_DB_NAME || "wpblog";
const password = `Local-${randomBytes(6).toString("base64url")}-Admin!`;
const salt = randomBytes(16).toString("hex");
const hash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;

await mongoose.connect(uri, { dbName: database });
const result = await mongoose.connection.collection("users").updateOne(
  { username: "admin" },
  { $set: { passwordHash: hash, isActive: true, updatedAt: new Date().toISOString() } },
);
await mongoose.disconnect();

if (result.matchedCount !== 1) {
  throw new Error("No existing local admin user was found; refusing to create one implicitly.");
}

console.log(`username=admin`);
console.log(`password=${password}`);
