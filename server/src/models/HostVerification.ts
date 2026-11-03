import mongoose, { type InferSchemaType } from "mongoose";

const hostVerificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    businessName: { type: String, trim: true, maxlength: 120, default: "" },
    website: { type: String, trim: true, maxlength: 2048, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 1200 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    adminNote: { type: String, trim: true, maxlength: 500, default: "" },
    reviewedBy: { type: String, trim: true, lowercase: true, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

export type HostVerificationRecord = InferSchemaType<typeof hostVerificationSchema>;

export const HostVerification =
  (mongoose.models.HostVerification as mongoose.Model<HostVerificationRecord> | undefined)
  ?? mongoose.model<HostVerificationRecord>("HostVerification", hostVerificationSchema);
