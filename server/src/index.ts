import { app } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

async function startServer(): Promise<void> {
  if (env.mongoUri) {
    try {
      await connectDatabase();
      console.info("MongoDB connected.");
    } catch (error) {
      console.error("MongoDB connection failed:", error);
    }
  } else {
    console.warn("MONGODB_URI is not configured; database-backed features are unavailable.");
  }

  app.listen(env.port, () => {
    console.info(`StudioSpace API listening on http://localhost:${env.port}`);
  });
}

void startServer();
