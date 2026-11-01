import mongoose, { type InferSchemaType } from "mongoose";

const newsletterSubscriptionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
  },
  { timestamps: true, versionKey: false },
);

export type NewsletterSubscriptionRecord = InferSchemaType<typeof newsletterSubscriptionSchema>;

export const NewsletterSubscription =
  (mongoose.models.NewsletterSubscription as mongoose.Model<NewsletterSubscriptionRecord> | undefined)
  ?? mongoose.model<NewsletterSubscriptionRecord>("NewsletterSubscription", newsletterSubscriptionSchema);
