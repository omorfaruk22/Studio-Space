import mongoose, { type InferSchemaType } from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: "Studio", required: true },
    userId: { type: String, required: true },
    studioTitle: { type: String, required: true, trim: true },
    studioImage: { type: String, required: true },
    studioLocation: { type: String, required: true, trim: true },
    bookingDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startTime: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^(?:[01]\d|2[0-3]):[0-5]\d$/ },
    numberOfPeople: { type: Number, required: true, min: 1 },
    durationMinutes: { type: Number, required: true, min: 1 },
    hourlyRate: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Pending", "Confirmed", "Completed", "Cancelled"], default: "Pending", required: true },
  },
  { timestamps: true, versionKey: false },
);

bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ studioId: 1, bookingDate: 1, status: 1, startTime: 1, endTime: 1 });

export type BookingRecord = InferSchemaType<typeof bookingSchema>;

export const Booking =
  (mongoose.models.Booking as mongoose.Model<BookingRecord> | undefined)
  ?? mongoose.model<BookingRecord>("Booking", bookingSchema);
