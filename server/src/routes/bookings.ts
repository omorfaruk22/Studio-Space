import { Router } from "express";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { confirmedBookingOverlapRange } from "../lib/booking-overlap.js";
import { createBookingInvoicePdf } from "../lib/booking-invoice-pdf.js";
import { Booking } from "../models/Booking.js";
import { Review } from "../models/Review.js";
import { Studio } from "../models/Studio.js";
import { notifyInBackground } from "../lib/email.js";

export const bookingsRouter = Router();

class BookingConflictError extends Error {}

const idPattern = /^[a-f\d]{24}$/i;
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function serializeBooking(booking: {
  _id: unknown;
  studioId: unknown;
  studioTitle: string;
  studioImage: string;
  studioLocation: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  durationMinutes: number;
  hourlyRate: number;
  totalPrice: number;
  securityDeposit: number;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status: string;
  paymentStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(booking._id),
    studioId: String(booking.studioId),
    studio: {
      title: booking.studioTitle,
      image: booking.studioImage,
      location: booking.studioLocation,
    },
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    numberOfPeople: booking.numberOfPeople,
    durationMinutes: booking.durationMinutes,
    hourlyRate: booking.hourlyRate,
    totalPrice: booking.totalPrice,
    securityDeposit: booking.securityDeposit,
    customerName: booking.customerName ?? "",
    customerEmail: booking.customerEmail ?? "",
    customerPhone: booking.customerPhone ?? "",
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? "unpaid",
    createdAt: booking.createdAt?.toISOString(),
    updatedAt: booking.updatedAt?.toISOString(),
  };
}

function timeInMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isRealDate(value: string): boolean {
  const match = datePattern.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// This router is mounted at /api alongside public routers, so keep auth scoped
// to the booking endpoints instead of intercepting unrelated public routes.
bookingsRouter.use("/bookings", requireAuth);
bookingsRouter.use("/my-bookings", requireAuth);
bookingsRouter.use("/host/bookings", requireAuth);

bookingsRouter.post("/bookings", async (request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Bookings are temporarily unavailable." });
      return;
    }

    const { studioId, bookingDate, startTime, endTime, numberOfPeople, timeZoneOffsetMinutes } = request.body ?? {};
    const customerPhone = typeof request.body?.customerPhone === "string" ? request.body.customerPhone.trim() : "";
    if (typeof studioId !== "string" || !idPattern.test(studioId)) {
      response.status(400).json({ status: "error", message: "Choose a valid studio." });
      return;
    }
    if (typeof bookingDate !== "string" || !isRealDate(bookingDate)) {
      response.status(400).json({ status: "error", message: "Choose a valid booking date." });
      return;
    }
    if (bookingDate < new Date().toISOString().slice(0, 10)) {
      response.status(400).json({ status: "error", message: "The booking date cannot be in the past." });
      return;
    }
    if (typeof startTime !== "string" || !timePattern.test(startTime)
      || typeof endTime !== "string" || !timePattern.test(endTime)
      || timeInMinutes(endTime) <= timeInMinutes(startTime)) {
      response.status(400).json({ status: "error", message: "End time must be later than start time on the same day." });
      return;
    }
    if (typeof timeZoneOffsetMinutes !== "number" || !Number.isInteger(timeZoneOffsetMinutes)
      || timeZoneOffsetMinutes < -840 || timeZoneOffsetMinutes > 840) {
      response.status(400).json({ status: "error", message: "The booking time zone is invalid." });
      return;
    }
    if (!/^\+?[\d ()-]{7,30}$/.test(customerPhone)) {
      response.status(400).json({ status: "error", message: "Add a valid contact phone number for booking updates." });
      return;
    }
    const [year, month, day] = bookingDate.split("-").map(Number);
    const [hour, minute] = startTime.split(":").map(Number);
    const startAtUtc = Date.UTC(year, month - 1, day, hour, minute) + timeZoneOffsetMinutes * 60_000;
    if (startAtUtc <= Date.now()) {
      response.status(400).json({ status: "error", message: "Choose a start time in the future." });
      return;
    }
    if (typeof numberOfPeople !== "number" || !Number.isInteger(numberOfPeople) || numberOfPeople < 1) {
      response.status(400).json({ status: "error", message: "Enter a valid number of people." });
      return;
    }

    const studio = await Studio.findOne({ _id: studioId, isAvailable: true })
      .select("title image location hourlyRate securityDeposit maxCapacity ownerEmail ownerName moderationStatus")
      .lean();
    if (!studio || (studio.moderationStatus && studio.moderationStatus !== "approved")) {
      response.status(404).json({ status: "error", message: "This studio is not available for booking." });
      return;
    }
    if (numberOfPeople > studio.maxCapacity) {
      response.status(400).json({ status: "error", message: `This studio can host up to ${studio.maxCapacity} people.` });
      return;
    }

    const confirmedConflict = await Booking.exists({
      studioId: studio._id,
      bookingDate,
      status: "Confirmed",
      ...confirmedBookingOverlapRange(startTime, endTime),
    });
    if (confirmedConflict) {
      response.status(409).json({
        status: "error",
        message: "That time overlaps an already confirmed booking. Choose another time.",
      });
      return;
    }

    const session = response.locals.authSession as { user: { id: string; name: string; email: string } };
    const durationMinutes = timeInMinutes(endTime) - timeInMinutes(startTime);
    const totalPrice = Math.round((studio.hourlyRate * durationMinutes / 60) * 100) / 100;
    const booking = await Booking.create({
      studioId: studio._id,
      userId: session.user.id,
      studioTitle: studio.title,
      studioImage: studio.image,
      studioLocation: studio.location,
      customerName: session.user.name,
      customerEmail: session.user.email,
      customerPhone,
      bookingDate,
      startTime,
      endTime,
      numberOfPeople,
      durationMinutes,
      hourlyRate: studio.hourlyRate,
      totalPrice,
      securityDeposit: studio.securityDeposit,
      timeZoneOffsetMinutes,
      status: "Pending",
    });

    notifyInBackground({
      to: studio.ownerEmail,
      subject: `New booking request: ${studio.title}`,
      text: `${session.user.name} requested ${studio.title} on ${bookingDate}, ${startTime}–${endTime}. Contact: ${session.user.email} · ${customerPhone}. Review the request in your StudioSpace dashboard.`,
    });
    notifyInBackground({
      to: session.user.email,
      subject: `Booking request sent: ${studio.title}`,
      text: `Your request for ${studio.title} on ${bookingDate}, ${startTime}–${endTime} has been sent to the host. The booking is not confirmed until the host accepts it.`,
    });

    response.status(201).json({ booking: serializeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get("/my-bookings", async (_request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Bookings are temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const bookings = await Booking.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();
    const reviewedIds = new Set((await Review.find({ bookingId: { $in: bookings.map((booking) => booking._id) } }).select("bookingId").lean()).map((review) => String(review.bookingId)));
    response.json({ bookings: bookings.map((booking) => ({ ...serializeBooking(booking), reviewSubmitted: reviewedIds.has(String(booking._id)) })) });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get("/host/bookings", async (_request, response, next) => {
  try {
    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Bookings are temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const studios = await Studio.find({ ownerId: session.user.id }).select("_id").lean();
    const studioIds = studios.map((studio) => studio._id);
    const bookings = studioIds.length
      ? await Booking.find({ studioId: { $in: studioIds } }).sort({ createdAt: -1 }).lean()
      : [];
    response.json({ bookings: bookings.map(serializeBooking) });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/host/bookings/:id/confirm", async (request, response, next) => {
  try {
    if (!idPattern.test(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid booking ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Bookings are temporarily unavailable." });
      return;
    }

    const sessionUser = response.locals.authSession as { user: { id: string } };
    const mongoSession = await mongoose.startSession();
    try {
      const result = await mongoSession.withTransaction(async () => {
        const booking = await Booking.findOne({ _id: request.params.id, status: "Pending" }).session(mongoSession);
        if (!booking) return { kind: "not-pending" as const };

        // Updating the same studio document forces concurrent confirmations to retry
        // against the latest confirmed bookings instead of both passing a stale read.
        const studio = await Studio.findOneAndUpdate(
          { _id: booking.studioId, ownerId: sessionUser.user.id },
          { $inc: { bookingRevision: 1 } },
          { new: true, session: mongoSession },
        );
        if (!studio) return { kind: "not-owned" as const };

        const overlap = await Booking.exists({
          studioId: booking.studioId,
          bookingDate: booking.bookingDate,
          status: "Confirmed",
          startTime: { $lt: booking.endTime },
          endTime: { $gt: booking.startTime },
        }).session(mongoSession);
        if (overlap) throw new BookingConflictError("That time overlaps another confirmed booking.");

        booking.status = "Confirmed";
        await booking.save({ session: mongoSession });
        return { kind: "confirmed" as const, booking: serializeBooking(booking) };
      });

      if (result?.kind === "not-owned") {
        response.status(404).json({ status: "error", message: "Booking not found." });
        return;
      }
      if (result?.kind === "not-pending") {
        const ownedBooking = await Booking.findById(request.params.id).lean();
        if (!ownedBooking) {
          response.status(404).json({ status: "error", message: "Booking not found." });
        } else {
          const ownedStudio = await Studio.exists({ _id: ownedBooking.studioId, ownerId: sessionUser.user.id });
          response.status(ownedStudio ? 409 : 404).json({
            status: "error",
            message: ownedStudio ? "Only pending booking requests can be confirmed." : "Booking not found.",
          });
        }
        return;
      }
      if (result?.kind === "confirmed") {
        const confirmed = await Booking.findById(request.params.id).select("customerEmail studioTitle bookingDate startTime endTime").lean();
        if (confirmed?.customerEmail) {
          notifyInBackground({
            to: confirmed.customerEmail,
            subject: `Booking confirmed: ${confirmed.studioTitle}`,
            text: `Your booking for ${confirmed.studioTitle} on ${confirmed.bookingDate}, ${confirmed.startTime}–${confirmed.endTime} is confirmed. You can pay for the rental from My Bookings.`,
          });
        }
        response.json({ booking: result.booking });
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

bookingsRouter.patch("/host/bookings/:id/decline", async (request, response, next) => {
  try {
    if (!idPattern.test(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid booking ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Bookings are temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const booking = await Booking.findById(request.params.id).select("studioId").lean();
    if (!booking) {
      response.status(404).json({ status: "error", message: "Booking not found." });
      return;
    }

    const ownedStudio = await Studio.exists({ _id: booking.studioId, ownerId: session.user.id });
    if (!ownedStudio) {
      response.status(404).json({ status: "error", message: "Booking not found." });
      return;
    }

    const declinedBooking = await Booking.findOneAndUpdate(
      { _id: request.params.id, studioId: booking.studioId, status: "Pending" },
      { $set: { status: "Declined" } },
      { new: true, runValidators: true },
    ).lean();
    if (!declinedBooking) {
      response.status(409).json({ status: "error", message: "Only pending booking requests can be declined." });
      return;
    }
    response.json({ booking: serializeBooking(declinedBooking) });
    if (declinedBooking.customerEmail) {
      notifyInBackground({
        to: declinedBooking.customerEmail,
        subject: `Booking update: ${declinedBooking.studioTitle}`,
        text: `The host could not accept your request for ${declinedBooking.studioTitle} on ${declinedBooking.bookingDate}. Browse other available studios for another time.`,
      });
    }
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get("/bookings/:id", async (request, response, next) => {
  try {
    if (!idPattern.test(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid booking ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Bookings are temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const booking = await Booking.findOne({ _id: request.params.id, userId: session.user.id }).lean();
    if (!booking) {
      response.status(404).json({ status: "error", message: "Booking not found." });
      return;
    }
    response.json({ booking: serializeBooking(booking) });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get("/bookings/:id/invoice", async (request, response, next) => {
  try {
    if (!idPattern.test(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid booking ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Bookings are temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const booking = await Booking.findOne({
      _id: request.params.id,
      userId: session.user.id,
      status: "Confirmed",
    }).lean();
    if (!booking) {
      const ownedBooking = await Booking.exists({ _id: request.params.id, userId: session.user.id });
      response.status(ownedBooking ? 409 : 404).json({
        status: "error",
        message: ownedBooking ? "A PDF summary is available after the host confirms this booking." : "Booking not found.",
      });
      return;
    }

    const pdf = createBookingInvoicePdf({
      id: String(booking._id),
      studioTitle: booking.studioTitle,
      studioLocation: booking.studioLocation,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      numberOfPeople: booking.numberOfPeople,
      durationMinutes: booking.durationMinutes,
      hourlyRate: booking.hourlyRate,
      totalPrice: booking.totalPrice,
      securityDeposit: booking.securityDeposit,
    });
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename="studio-booking-${booking._id}.pdf"`);
    response.setHeader("Cache-Control", "private, no-store");
    response.send(pdf);
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/bookings/:id/cancel", async (request, response, next) => {
  try {
    if (!idPattern.test(request.params.id)) {
      response.status(400).json({ status: "error", message: "Invalid booking ID." });
      return;
    }

    const database = await connectDatabase();
    if (!database) {
      response.status(503).json({ status: "error", message: "Bookings are temporarily unavailable." });
      return;
    }

    const session = response.locals.authSession as { user: { id: string } };
    const booking = await Booking.findOneAndUpdate(
      { _id: request.params.id, userId: session.user.id, status: "Pending" },
      { $set: { status: "Cancelled" } },
      { new: true, runValidators: true },
    ).lean();

    if (!booking) {
      const existing = await Booking.exists({ _id: request.params.id, userId: session.user.id });
      if (!existing) {
        response.status(404).json({ status: "error", message: "Booking not found." });
        return;
      }
      response.status(409).json({ status: "error", message: "Only pending bookings can be cancelled." });
      return;
    }
    response.json({ booking: serializeBooking(booking) });
    const studio = await Studio.findById(booking.studioId).select("ownerEmail").lean();
    if (studio?.ownerEmail) {
      notifyInBackground({
        to: studio.ownerEmail,
        subject: `Booking cancelled: ${booking.studioTitle}`,
        text: `The customer cancelled the pending request for ${booking.studioTitle} on ${booking.bookingDate}, ${booking.startTime}–${booking.endTime}.`,
      });
    }
  } catch (error) {
    next(error);
  }
});
