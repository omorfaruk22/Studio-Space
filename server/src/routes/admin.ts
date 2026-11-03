import { Router } from "express";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Booking } from "../models/Booking.js";
import { Studio } from "../models/Studio.js";
import { parseStudioInput, serializeStudio } from "./host-studios.js";

export const adminRouter = Router();

const bookingStatuses = ["Pending", "Confirmed", "Completed", "Cancelled", "Declined"] as const;

class BookingConflictError extends Error {}

adminRouter.get("/admin/access", requireAuth, (_request, response) => {
  const session = response.locals.authSession as { user?: { email?: string } } | undefined;
  const email = session?.user?.email?.trim().toLowerCase();
  response.setHeader("cache-control", "no-store");
  response.json({ isAdmin: Boolean(email && env.adminEmails.includes(email)) });
});

adminRouter.use("/admin", requireAuth, requireAdmin);

adminRouter.get("/admin/overview", async (_request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Admin data is temporarily unavailable." });
      return;
    }

    const [
      studioCount,
      liveStudioCount,
      hiddenStudioCount,
      bookingCount,
      pendingBookingCount,
      confirmedBookingCount,
      recentStudios,
      recentBookings,
    ] = await Promise.all([
      Studio.countDocuments(),
      Studio.countDocuments({ isAvailable: true }),
      Studio.countDocuments({ isAvailable: false }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "Pending" }),
      Booking.countDocuments({ status: "Confirmed" }),
      Studio.find().sort({ createdAt: -1 }).lean(),
      Booking.find().sort({ createdAt: -1 }).lean(),
    ]);

    response.json({
      stats: {
        studioCount,
        liveStudioCount,
        hiddenStudioCount,
        bookingCount,
        pendingBookingCount,
        confirmedBookingCount,
      },
      studios: recentStudios.map(serializeStudio),
      bookings: recentBookings.map((booking) => ({
        id: String(booking._id),
        studioId: String(booking.studioId),
        studioTitle: booking.studioTitle,
        studioLocation: booking.studioLocation,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        numberOfPeople: booking.numberOfPeople,
        totalPrice: booking.totalPrice,
        status: booking.status,
        createdAt: booking.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/admin/studios/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid studio ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio management is temporarily unavailable." });
      return;
    }

    const studio = await Studio.findById(request.params.id).lean();
    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio could not be found." });
      return;
    }
    response.json({ studio: serializeStudio(studio) });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/studios/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid studio ID." });
      return;
    }

    const parsed = parseStudioInput(request.body);
    if (!parsed.input) {
      response.status(400).json({ status: "error", message: parsed.message });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio management is temporarily unavailable." });
      return;
    }

    const studio = await Studio.findByIdAndUpdate(
      request.params.id,
      { $set: parsed.input },
      { new: true, runValidators: true },
    ).lean();
    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio could not be found." });
      return;
    }
    response.json({ studio: serializeStudio(studio) });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/studios/:id/availability", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id) || typeof request.body?.isAvailable !== "boolean") {
      response.status(400).json({ status: "error", message: "Choose a valid studio and visibility state." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio management is temporarily unavailable." });
      return;
    }

    const studio = await Studio.findByIdAndUpdate(
      request.params.id,
      { $set: { isAvailable: request.body.isAvailable } },
      { new: true, runValidators: true },
    ).lean();

    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio could not be found." });
      return;
    }

    response.json({ studio: { id: String(studio._id), isAvailable: studio.isAvailable } });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/bookings/:id/status", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid booking ID." });
      return;
    }
    if (typeof request.body?.status !== "string" || !bookingStatuses.includes(request.body.status as (typeof bookingStatuses)[number])) {
      response.status(400).json({ status: "error", message: "Choose a valid booking status." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Booking management is temporarily unavailable." });
      return;
    }

    const status = request.body.status as (typeof bookingStatuses)[number];
    if (status !== "Confirmed") {
      const booking = await Booking.findByIdAndUpdate(
        request.params.id,
        { $set: { status } },
        { new: true, runValidators: true },
      ).lean();
      if (!booking) {
        response.status(404).json({ status: "error", message: "This booking could not be found." });
        return;
      }
      response.json({ booking: { id: String(booking._id), status: booking.status } });
      return;
    }

    const mongoSession = await mongoose.startSession();
    try {
      const result = await mongoSession.withTransaction(async () => {
        const booking = await Booking.findById(request.params.id).session(mongoSession);
        if (!booking) return { kind: "not-found" as const };

        const studio = await Studio.findByIdAndUpdate(
          booking.studioId,
          { $inc: { bookingRevision: 1 } },
          { new: true, session: mongoSession },
        );
        if (!studio) return { kind: "studio-missing" as const };

        const overlap = await Booking.exists({
          _id: { $ne: booking._id },
          studioId: booking.studioId,
          bookingDate: booking.bookingDate,
          status: "Confirmed",
          startTime: { $lt: booking.endTime },
          endTime: { $gt: booking.startTime },
        }).session(mongoSession);
        if (overlap) throw new BookingConflictError("That time overlaps another confirmed booking.");

        booking.status = "Confirmed";
        await booking.save({ session: mongoSession });
        return { kind: "confirmed" as const, bookingId: String(booking._id) };
      });

      if (result?.kind === "not-found") {
        response.status(404).json({ status: "error", message: "This booking could not be found." });
        return;
      }
      if (result?.kind === "studio-missing") {
        response.status(409).json({ status: "error", message: "This booking is linked to a missing studio and cannot be confirmed." });
        return;
      }
      if (result?.kind === "confirmed") {
        response.json({ booking: { id: result.bookingId, status: "Confirmed" } });
        return;
      }
      response.status(500).json({ status: "error", message: "The booking could not be confirmed." });
    } catch (error) {
      if (error instanceof BookingConflictError) {
        response.status(409).json({ status: "error", message: error.message });
        return;
      }
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  } catch (error) {
    next(error);
  }
});
