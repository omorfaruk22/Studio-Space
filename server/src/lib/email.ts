import nodemailer from "nodemailer";
import { env } from "../config/env.js";

type EmailMessage = { to: string; subject: string; text: string };

const smtpConfigured = Boolean(env.smtpHost && env.smtpUser && env.smtpPassword && env.emailFrom);
const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: { user: env.smtpUser, pass: env.smtpPassword },
    })
  : null;
let missingSmtpLogged = false;

export async function sendNotificationEmail(message: EmailMessage): Promise<boolean> {
  if (!transporter) {
    if (!missingSmtpLogged) {
      console.info("Email notifications are disabled until SMTP credentials are configured.");
      missingSmtpLogged = true;
    }
    return false;
  }

  await transporter.sendMail({
    from: env.emailFrom,
    to: message.to,
    subject: message.subject,
    text: message.text,
  });
  return true;
}

export function notifyInBackground(message: EmailMessage): void {
  void sendNotificationEmail(message).catch((error: unknown) => {
    const detail = error instanceof Error ? error.message : "unknown email transport error";
    console.error(`StudioSpace email notification failed: ${detail}`);
  });
}
