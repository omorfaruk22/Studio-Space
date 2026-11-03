import mongoose, { type InferSchemaType } from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: "Studio", required: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true, trim: true, maxlength: 120 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1200 },
  },
  { timestamps: true, versionKey: false },
);

reviewSchema.index({ studioId: 1, createdAt: -1 });

export type ReviewRecord = InferSchemaType<typeof reviewSchema>;

export const Review =
  (mongoose.models.Review as mongoose.Model<ReviewRecord> | undefined)
  ?? mongoose.model<ReviewRecord>("Review", reviewSchema);
