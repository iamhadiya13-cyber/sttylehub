import { Schema, model, models, type InferSchemaType } from "mongoose";

const ReviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, required: true, trim: true },
    comment: { type: String, required: true, trim: true },
    images: [{ type: String }],
    isApproved: { type: Boolean, default: false, index: true },
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulVotes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

export type ReviewDocument = InferSchemaType<typeof ReviewSchema>;
export const Review = models.Review || model("Review", ReviewSchema);
export default Review;
