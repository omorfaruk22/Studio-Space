import { fromNodeHeaders } from "better-auth/node";
import type { RequestHandler } from "express";
import { auth } from "../auth.js";

export const requireAuth: RequestHandler = async (request, response, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      response.status(401).json({ status: "error", message: "Authentication is required." });
      return;
    }

    response.locals.authSession = session;
    next();
  } catch (error) {
    next(error);
  }
};
