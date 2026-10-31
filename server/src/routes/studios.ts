import { Router } from "express";
import { connectDatabase } from "../config/database.js";
import { Studio } from "../models/Studio.js";

export const studiosRouter = Router();

studiosRouter.get("/studios/featured", async (_request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio listings are temporarily unavailable." });
      return;
    }

    const studios = await Studio.find({ isAvailable: true })
      .select("title category hourlyRate location image rating createdAt")
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .lean();

    response.json({
      studios: studios.map((studio) => ({
        id: String(studio._id),
        title: studio.title,
        category: studio.category,
        hourlyRate: studio.hourlyRate,
        location: studio.location,
        image: studio.image,
        rating: studio.rating,
      })),
    });
  } catch (error) {
    next(error);
  }
});
