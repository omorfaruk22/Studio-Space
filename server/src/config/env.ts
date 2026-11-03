import dotenv from "dotenv";
import { existsSync } from "node:fs";

dotenv.config({ path: existsSync(".env.local") ? ".env.local" : ".env" });

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port,
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI,
  betterAuthSecret: process.env.BETTER_AUTH_SECRET,
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? `http://localhost:${port}`,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  imgbbApiKey: process.env.IMGBB_API_KEY,
  publicApiUrl: (process.env.PUBLIC_API_URL ?? `http://localhost:${port}`).replace(/\/$/, ""),
  sslCommerzStoreId: process.env.SSLCOMMERZ_STORE_ID,
  sslCommerzStorePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
  sslCommerzSandbox: process.env.SSLCOMMERZ_SANDBOX !== "false",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  emailFrom: process.env.EMAIL_FROM,
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
};
