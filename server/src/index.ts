import { app } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

type MongoFailure = {
  name?: string;
  code?: string | number;
  codeName?: string;
  reason?: {
    type?: string;
    servers?: Map<string, { error?: { name?: string; code?: string | number; codeName?: string } }>;
  };
};

function describeMongoFailure(error: unknown): string {
  const failure = (error ?? {}) as MongoFailure;
  const causes = [...(failure.reason?.servers?.values() ?? [])]
    .map((server) => server.error)
    .filter((cause): cause is NonNullable<typeof cause> => Boolean(cause));
  const isAuthenticationFailure = [failure, ...causes].some(
    (cause) => cause.code === 18 || cause.codeName === "AuthenticationFailed",
  );

  if (failure.name === "MongoParseError") {
    return "MongoDB URI format is invalid. Check the URI structure and URL-encode special characters in its credentials.";
  }

  if (isAuthenticationFailure) {
    return "MongoDB rejected the database credentials. Check the Database Access user and URL-encode special characters in its password.";
  }

  if (failure.name === "MongooseServerSelectionError" || causes.some((cause) => cause.name?.includes("Network"))) {
    const causeNames = [...new Set(causes.map((cause) => cause.name).filter(Boolean))].join(", ") || "none reported";
    const topology = failure.reason?.type ?? "unknown";
    return `Could not reach an Atlas node (topology: ${topology}; causes: ${causeNames}). Check the active IP access entry, cluster status, hostname, and outbound TCP access.`;
  }

  return `MongoDB connection error (${failure.name ?? "unknown"}; code: ${failure.codeName ?? failure.code ?? "none"}).`;
}

async function startServer(): Promise<void> {
  if (env.mongoUri) {
    try {
      await connectDatabase();
      console.info("MongoDB connected.");
    } catch (error) {
      console.error(`MongoDB connection failed: ${describeMongoFailure(error)}`);
    }
  } else {
    console.warn("MONGODB_URI is not configured; database-backed features are unavailable.");
  }

  app.listen(env.port, () => {
    console.info(`StudioSpace API listening on http://localhost:${env.port}`);
  });
}

void startServer();
