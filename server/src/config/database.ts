import mongoose from "mongoose";
import { env } from "./env";

let connectionPromise: Promise<typeof mongoose> | null = null;

/** Reuse an in-flight or established Mongoose connection across callers. */
export async function connectDatabase(): Promise<typeof mongoose | null> {
  if (!env.mongoUri) return null;
  if (mongoose.connection.readyState === 1) return mongoose;
  if (mongoose.connection.readyState === 2 && connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
  }).catch((error: unknown) => {
    connectionPromise = null;
    throw error;
  });

  return connectionPromise;
}

export function getDatabaseStatus(): "connected" | "connecting" | "disconnected" | "disconnecting" {
  switch (mongoose.connection.readyState) {
    case 1: return "connected";
    case 2: return "connecting";
    case 3: return "disconnecting";
    default: return "disconnected";
  }
}
