import mongoose, { type InferSchemaType } from "mongoose";

const savedStudioSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    studioId: { type: mongoose.Schema.Types.ObjectId, ref: "Studio", required: true },
  },
  { timestamps: true, versionKey: false },
);

savedStudioSchema.index({ userId: 1, studioId: 1 }, { unique: true });
savedStudioSchema.index({ userId: 1, createdAt: -1 });

export type SavedStudioRecord = InferSchemaType<typeof savedStudioSchema>;

export const SavedStudio =
  (mongoose.models.SavedStudio as mongoose.Model<SavedStudioRecord> | undefined)
  ?? mongoose.model<SavedStudioRecord>("SavedStudio", savedStudioSchema);
