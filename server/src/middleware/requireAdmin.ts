import type { RequestHandler } from "express";
import { env } from "../config/env.js";

export const requireAdmin: RequestHandler = (_request, response, next) => {
  const session = response.locals.authSession as { user?: { email?: string } } | undefined;
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email || !env.adminEmails.includes(email)) {
    response.status(403).json({
      status: "error",
      message: "This account is not on the StudioSpace admin allowlist.",
    });
    return;
  }

  next();
};
