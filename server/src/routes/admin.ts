import { Router } from "express";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { Booking } from "../models/Booking.js";
import { HostVerification } from "../models/HostVerification.js";
import { Studio } from "../models/Studio.js";
import { notifyInBackground } from "../lib/email.js";
import { publicStudioFilter } from "../lib/studio-visibility.js";
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
      totalStudioCount,
      liveStudioCount,
      bookingCount,
      pendingBookingCount,
      confirmedBookingCount,
      pendingModerationCount,
      recentStudios,
      recentBookings,
      verificationRequests,
    ] = await Promise.all([
      Studio.countDocuments(),
      Studio.countDocuments({ ...publicStudioFilter }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "Pending" }),
      Booking.countDocuments({ status: "Confirmed" }),
      Studio.countDocuments({ moderationStatus: "pending" }),
      Studio.find().sort({ createdAt: -1 }).lean(),
      Booking.find().sort({ createdAt: -1 }).lean(),
      HostVerification.find().sort({ updatedAt: -1 }).lean(),
    ]);

    const publicCount = liveStudioCount;
    response.json({
      stats: {
        studioCount: totalStudioCount,
        liveStudioCount,
        hiddenStudioCount: Math.max(0, totalStudioCount - publicCount),
        bookingCount,
        pendingBookingCount,
        confirmedBookingCount,
        pendingModerationCount,
      },
      studios: recentStudios.map(serializeStudio),
      verificationRequests: verificationRequests.map((request) => ({
        id: String(request._id),
        userId: request.userId,
        name: request.name,
        email: request.email,
        businessName: request.businessName,
        website: request.website,
        message: request.message,
        status: request.status,
        adminNote: request.adminNote,
        createdAt: request.createdAt?.toISOString(),
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
        customerName: booking.customerName ?? "",
        customerEmail: booking.customerEmail ?? "",
        customerPhone: booking.customerPhone ?? "",
        paymentStatus: booking.paymentStatus ?? "unpaid",
        status: booking.status,
        createdAt: booking.createdAt?.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/studios/:id/moderation", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)
      || !["approved", "rejected"].includes(request.body?.status)
      || (request.body?.note !== undefined && (typeof request.body.note !== "string" || request.body.note.length > 500))) {
      response.status(400).json({ status: "error", message: "Choose an approval state and a note under 500 characters." });
      return;
    }
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Studio moderation is temporarily unavailable." });
      return;
    }
    const status = request.body.status as "approved" | "rejected";
    const studio = await Studio.findByIdAndUpdate(
      request.params.id,
      { $set: { moderationStatus: request.body.status, moderationNote: request.body.note?.trim() ?? "" } },
      { new: true, runValidators: true },
    ).lean();
    if (!studio) {
      response.status(404).json({ status: "error", message: "This studio could not be found." });
      return;
    }
    notifyInBackground({
      to: studio.ownerEmail,
      subject: status === "approved" ? `Studio approved: ${studio.title}` : `Studio review update: ${studio.title}`,
      text: status === "approved"
        ? `Your studio listing “${studio.title}” has been approved and is now eligible to appear publicly. You can manage its availability in your dashboard.`
        : `Your studio listing “${studio.title}” was not approved yet. ${request.body.note?.trim() ? `Admin note: ${request.body.note.trim()}` : "Open your dashboard to review the listing and make any needed changes."}`,
    });
    response.json({ studio: { id: String(studio._id), moderationStatus: studio.moderationStatus, isAvailable: studio.isAvailable } });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/admin/host-verifications/:id", async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)
      || !["approved", "rejected"].includes(request.body?.status)
      || (request.body?.adminNote !== undefined && (typeof request.body.adminNote !== "string" || request.body.adminNote.length > 500))) {
      response.status(400).json({ status: "error", message: "Choose an approval state and a note under 500 characters." });
      return;
    }
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Host verification is temporarily unavailable." });
      return;
    }
    const session = response.locals.authSession as { user: { email: string } };
    const verification = await HostVerification.findByIdAndUpdate(
      request.params.id,
      { $set: {
        status: request.body.status,
        adminNote: request.body.adminNote?.trim() ?? "",
        reviewedBy: session.user.email,
        reviewedAt: new Date(),
      } },
      { new: true, runValidators: true },
    ).lean();
    if (!verification) {
      response.status(404).json({ status: "error", message: "This verification request could not be found." });
      return;
    }
    notifyInBackground({
      to: verification.email,
      subject: request.body.status === "approved" ? "StudioSpace host verification approved" : "StudioSpace host verification update",
      text: request.body.status === "approved"
        ? "Your StudioSpace host verification has been approved. Your public studio pages can now show the verified host badge."
        : `Your StudioSpace host verification was not approved. ${request.body.adminNote?.trim() ? `Admin note: ${request.body.adminNote.trim()}` : "You can update your request from your dashboard."}`,
    });
    response.json({ verification: { id: String(verification._id), status: verification.status, adminNote: verification.adminNote } });
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
      if (booking.customerEmail && status !== "Pending") {
        notifyInBackground({
          to: booking.customerEmail,
          subject: `Booking update: ${booking.studioTitle}`,
          text: `An administrator updated your ${booking.studioTitle} booking for ${booking.bookingDate} to ${status}. Open My Bookings to see its current status.`,
        });
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
        const booking = await Booking.findById(result.bookingId).select("customerEmail studioTitle bookingDate startTime endTime").lean();
        if (booking?.customerEmail) {
          notifyInBackground({
            to: booking.customerEmail,
            subject: `Booking confirmed: ${booking.studioTitle}`,
            text: `Your booking for ${booking.studioTitle} on ${booking.bookingDate}, ${booking.startTime}–${booking.endTime} is confirmed. You can pay for the rental from My Bookings.`,
          });
        }
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
