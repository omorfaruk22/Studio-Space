import { Router } from "express";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Booking } from "../models/Booking.js";
import { Studio } from "../models/Studio.js";

export const adminRouter = Router();

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
      Studio.find().sort({ createdAt: -1 }).limit(20).lean(),
      Booking.find().sort({ createdAt: -1 }).limit(20).lean(),
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
      studios: recentStudios.map((studio) => ({
        id: String(studio._id),
        title: studio.title,
        category: studio.category,
        location: studio.location,
        hourlyRate: studio.hourlyRate,
        ownerName: studio.ownerName,
        ownerEmail: studio.ownerEmail,
        isAvailable: studio.isAvailable,
        createdAt: studio.createdAt?.toISOString(),
      })),
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
