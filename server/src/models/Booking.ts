import mongoose, { type InferSchemaType } from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: "Studio", required: true },
    userId: { type: String, required: true },
    studioTitle: { type: String, required: true, trim: true },
    studioImage: { type: String, required: true },
    studioLocation: { type: String, required: true, trim: true },
    customerName: { type: String, trim: true, maxlength: 120 },
    customerEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },
    customerPhone: { type: String, trim: true, maxlength: 30 },
    bookingDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startTime: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
    numberOfPeople: { type: Number, required: true, min: 1 },
    durationMinutes: { type: Number, required: true, min: 1 },
    hourlyRate: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, required: true, min: 0 },
    timeZoneOffsetMinutes: { type: Number, min: -840, max: 840, default: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "pending", "paid", "failed", "cancelled", "review"], default: "unpaid", index: true },
    paymentProvider: { type: String, enum: ["sslcommerz"] },
    paymentCurrency: { type: String, maxlength: 3 },
    paymentTransactionId: { type: String, maxlength: 30, index: true },
    paymentGatewayUrl: { type: String, maxlength: 2048 },
    paymentValidationId: { type: String, maxlength: 50 },
    paidAt: { type: Date },
    status: { type: String, enum: ["Pending", "Confirmed", "Completed", "Cancelled", "Declined"], default: "Pending", required: true },
  },
  { timestamps: true, versionKey: false },
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ studioId: 1, bookingDate: 1, status: 1, startTime: 1, endTime: 1 });

export type BookingRecord = InferSchemaType<typeof bookingSchema>;

export const Booking =
  (mongoose.models.Booking as mongoose.Model<BookingRecord> | undefined)
  ?? mongoose.model<BookingRecord>("Booking", bookingSchema);
