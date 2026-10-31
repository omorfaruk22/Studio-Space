import { Router } from "express";
import { connectDatabase } from "../config/database.js";
import { Studio } from "../models/Studio.js";

export const studioDetailsRouter = Router();

studioDetailsRouter.get("/studios/:id", async (request, response, next) => {
  try {
    const id = request.params.id;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      response.status(400).json({ status: "error", message: "Invalid studio ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio details are temporarily unavailable." });
      return;
    }

    const studio = await Studio.findOne({ _id: id, isAvailable: true })
      .select("title category hourlyRate securityDeposit maxCapacity location image images amenities overview ownerName rating createdAt")
      .lean();

    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio could not be found." });
      return;
    }

    response.json({
      studio: {
        id: String(studio._id),
        title: studio.title,
        category: studio.category,
        hourlyRate: studio.hourlyRate,
        location: studio.location,
        image: studio.image,
        rating: studio.rating,
        createdAt: studio.createdAt?.toISOString(),
        images: studio.images ?? [],
        securityDeposit: studio.securityDeposit,
        maxCapacity: studio.maxCapacity,
        amenities: studio.amenities ?? [],
        overview: studio.overview,
        host: { name: studio.ownerName },
      },
    });
  } catch (error) {
    next(error);
  }
});
