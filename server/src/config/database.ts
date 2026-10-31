import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { env } from "./env.js";

let connectionPromise: Promise<typeof mongoose> | null = null;

const mongoUri = env.mongoUri ?? "mongodb://127.0.0.1:27017/studiospace";

/** Shared native MongoDB client used by Better Auth's Mongo adapter. */
export const mongoClient = new MongoClient(mongoUri);

/** Reuse an in-flight or established Mongoose connection across callers. */
export async function connectDatabase(): Promise<typeof mongoose | null> {
  if (!env.mongoUri) return null;
  if (mongoose.connection.readyState === 1) return mongoose;
  if (mongoose.connection.readyState === 2 && connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(mongoUri, {
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
