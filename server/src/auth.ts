import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { mongoClient } from "./config/database.js";
import { env } from "./config/env.js";

if (
  !env.betterAuthSecret ||
  env.betterAuthSecret.length < 32 ||
  (env.nodeEnv === "production" && env.betterAuthSecret.startsWith("replace-with-"))
) {
  throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
}

const googleProvider = env.googleClientId && env.googleClientSecret
  ? {
      google: {
        clientId: env.googleClientId,
        clientSecret: env.googleClientSecret,
        prompt: "select_account" as const,
      },
    }
  : undefined;

export const auth = betterAuth({
  appName: "StudioSpace",
  baseURL: env.betterAuthUrl,
  secret: env.betterAuthSecret,
  database: mongodbAdapter(mongoClient.db()),
  trustedOrigins: [env.clientOrigin],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
  },
  ...(googleProvider ? { socialProviders: googleProvider } : {}),
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.nodeEnv === "production",
    },
  },
  hooks: {
    before: createAuthMiddleware(async (context) => {
      if (context.path !== "/sign-up/email") return;

      const name = context.body?.name;
      if (typeof name !== "string" || name.trim().length < 2) {
        throw new APIError("BAD_REQUEST", { message: "Name must be at least 2 characters long." });
      }

      const password = context.body?.password;
      if (typeof password !== "string" || !/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
        throw new APIError("BAD_REQUEST", {
          message: "Password must include at least one uppercase and one lowercase letter.",
        });
      }

      const image = context.body?.image;
      if (image !== undefined && image !== "") {
        if (typeof image !== "string" || !URL.canParse(image)) {
          throw new APIError("BAD_REQUEST", { message: "Photo URL must be a valid URL." });
        }
      }
    }),
  },
});
