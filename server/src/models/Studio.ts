import mongoose, { type InferSchemaType } from "mongoose";

const studioSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      required: true,
      enum: ["photo", "sound-stage", "podcast", "music", "art"],
      index: true,
    },
    hourlyRate: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, required: true, min: 0, default: 0 },
    maxCapacity: { type: Number, required: true, min: 1 },
    location: { type: String, required: true, trim: true, maxlength: 180 },
    image: { type: String, required: true, trim: true },
    amenities: { type: [String], default: [] },
    overview: { type: String, required: true, trim: true, maxlength: 5000 },
    ownerId: { type: String, required: true, index: true },
    ownerName: { type: String, required: true, trim: true },
    ownerEmail: { type: String, required: true, trim: true, lowercase: true },
    rating: { type: Number, min: 0, max: 5, default: 0, index: true },
    isAvailable: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

studioSchema.index({ isAvailable: 1, rating: -1, createdAt: -1 });

export type StudioRecord = InferSchemaType<typeof studioSchema>;

export const Studio = mongoose.models.Studio ?? mongoose.model("Studio", studioSchema);
