import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | undefined;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is required. Set it to your MongoDB connection string.");
  }

  connectionPromise = mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME?.trim() || "wpblog",
  });

  return connectionPromise;
}

export async function disconnectDatabase(): Promise<void> {
  if (connectionPromise) {
    await mongoose.disconnect();
    connectionPromise = undefined;
  }
}

export function resetConnectionForTesting(): void {
  connectionPromise = undefined;
}
