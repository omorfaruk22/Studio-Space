import { Router } from "express";
import { connectDatabase } from "../config/database.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { SavedStudio } from "../models/SavedStudio.js";
import { Studio } from "../models/Studio.js";

export const savedStudiosRouter = Router();

const idPattern = /^[a-f\d]{24}$/i;

savedStudiosRouter.use("/saved-studios", requireAuth);

savedStudiosRouter.get("/saved-studios", async (_request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Saved studios are temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const saved = await SavedStudio.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();
    const studioIds = saved.map((item) => String(item.studioId));
    const records = studioIds.length
      ? await Studio.find({ _id: { $in: studioIds } })
          .select("title category hourlyRate location image rating createdAt isAvailable")
          .lean()
      : [];
    const byId = new Map(records.map((studio) => [String(studio._id), studio]));
    const studios = studioIds.flatMap((id) => {
      const studio = byId.get(id);
      if (!studio) return [];
      return [{
        id,
        title: studio.title,
        category: studio.category,
        hourlyRate: studio.hourlyRate,
        location: studio.location,
        image: studio.image,
        rating: studio.rating,
        createdAt: studio.createdAt?.toISOString(),
        isAvailable: studio.isAvailable,
      }];
    });

    response.json({ studioIds, studios });
  } catch (error) {
    next(error);
  }
});

savedStudiosRouter.put("/saved-studios/:studioId", async (request, response, next) => {
  try {
    if (!idPattern.test(request.params.studioId)) {
      response.status(400).json({ status: "error", message: "Invalid studio ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Saved studios are temporarily unavailable." });
      return;
    }

    const studio = await Studio.findOne({ _id: request.params.studioId, isAvailable: true }).select("_id").lean();
    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio is no longer available." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    try {
      await SavedStudio.updateOne(
        { userId: session.user.id, studioId: studio._id },
        { $setOnInsert: { userId: session.user.id, studioId: studio._id } },
        { upsert: true },
      );
    } catch (error) {
      if (!error || typeof error !== "object" || (error as { code?: number }).code !== 11000) throw error;
    }

    response.json({ saved: true });
  } catch (error) {
    next(error);
  }
});

savedStudiosRouter.delete("/saved-studios/:studioId", async (request, response, next) => {
  try {
    if (!idPattern.test(request.params.studioId)) {
      response.status(400).json({ status: "error", message: "Invalid studio ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Saved studios are temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    await SavedStudio.deleteOne({ userId: session.user.id, studioId: request.params.studioId });
    response.json({ saved: false });
  } catch (error) {
    next(error);
  }
});
