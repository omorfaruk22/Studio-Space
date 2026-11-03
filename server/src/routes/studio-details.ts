import { Router } from "express";
import { connectDatabase } from "../config/database.js";
import { publicStudioFilter } from "../lib/studio-visibility.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Booking } from "../models/Booking.js";
import { HostVerification } from "../models/HostVerification.js";
import { Review } from "../models/Review.js";
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

    const studio = await Studio.findOne({ _id: id, ...publicStudioFilter })
      .select("title category hourlyRate securityDeposit maxCapacity location image images amenities overview ownerId ownerName rating createdAt")
      .lean();

    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio could not be found." });
      return;
    }

    const verifiedHost = Boolean(await HostVerification.exists({ userId: studio.ownerId, status: "approved" }));

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
        hostVerified: verifiedHost,
      },
    });
  } catch (error) {
    next(error);
  }
});

studioDetailsRouter.get("/studios/:id/reviews", async (request, response, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(request.params.id)) {
      response.status(400).json({ status: "error", message: "Choose a valid studio." });
      return;
    }
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Reviews are temporarily unavailable." });
      return;
    }
    const studio = await Studio.exists({ _id: request.params.id, ...publicStudioFilter });
    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio is not available." });
      return;
    }
    const reviews = await Review.find({ studioId: request.params.id })
      .select("userName rating comment createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    response.setHeader("cache-control", "no-store");
    response.json({ reviews: reviews.map((review) => ({
      id: String(review._id),
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt?.toISOString(),
    })) });
  } catch (error) {
    next(error);
  }
});

studioDetailsRouter.post("/bookings/:bookingId/review", requireAuth, async (request, response, next) => {
  try {
    const bookingId = Array.isArray(request.params.bookingId) ? request.params.bookingId[0] : request.params.bookingId;
    if (!/^[a-f\d]{24}$/i.test(bookingId)) {
      response.status(400).json({ status: "error", message: "Choose a valid completed booking." });
      return;
    }
    const rating = request.body?.rating;
    const comment = typeof request.body?.comment === "string" ? request.body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 10 || comment.length > 1200) {
      response.status(400).json({ status: "error", message: "Choose 1–5 stars and write a review of 10–1,200 characters." });
      return;
    }
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Reviews are temporarily unavailable." });
      return;
    }
    const session = response.locals.authSession as { user: { id: string; name: string } };
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: session.user.id,
      status: "Completed",
    }).select("studioId").lean();
    if (!booking) {
      response.status(403).json({ status: "error", message: "Only completed bookings can be reviewed." });
      return;
    }
    if (!await Studio.exists({ _id: booking.studioId })) {
      response.status(404).json({ status: "error", message: "The studio linked to this booking could not be found." });
      return;
    }
    const existing = await Review.exists({ bookingId: booking._id });
    if (existing) {
      response.status(409).json({ status: "error", message: "A review was already submitted for this booking." });
      return;
    }
    const review = await Review.create({
      studioId: booking.studioId,
      bookingId: booking._id,
      userId: session.user.id,
      userName: session.user.name,
      rating,
      comment,
    });
    const [average] = await Review.aggregate<{ rating: number }>([
      { $match: { studioId: booking.studioId } },
      { $group: { _id: null, rating: { $avg: "$rating" } } },
    ]);
    await Studio.findByIdAndUpdate(booking.studioId, { $set: { rating: Math.round((average?.rating ?? rating) * 10) / 10 } });
    response.status(201).json({ review: {
      id: String(review._id),
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      response.status(409).json({ status: "error", message: "A review was already submitted for this booking." });
      return;
    }
    next(error);
  }
});
