import { Router } from "express";
import { connectDatabase } from "../config/database.js";
import { normalizeNewsletterEmail } from "../lib/newsletter.js";
import { NewsletterSubscription } from "../models/NewsletterSubscription.js";

export const newsletterRouter = Router();

const subscribedResponse = {
  message: "Thanks for joining the StudioSpace updates list.",
};

newsletterRouter.post("/newsletter", async (request, response, next) => {
  try {
    // Quietly accept honeypot submissions so automated form fillers get no signal.
    if (typeof request.body?.website === "string" && request.body.website.trim()) {
      response.status(202).json(subscribedResponse);
      return;
    }

    const email = normalizeNewsletterEmail(request.body?.email);
    if (!email) {
      response.status(400).json({ status: "error", message: "Enter a valid email address." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Newsletter sign-up is temporarily unavailable." });
      return;
    }

    try {
      await NewsletterSubscription.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    } catch (error) {
      if (!error || typeof error !== "object" || (error as { code?: number }).code !== 11000) throw error;
    }

    response.status(202).json(subscribedResponse);
  } catch (error) {
    next(error);
  }
});
