import { Schema, model, models, type InferSchemaType } from "mongoose";

const FlashSaleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    discountPercent: { type: Number, required: true, min: 1, max: 90 },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product", required: true }],
    status: {
      type: String,
      enum: ["draft", "active", "paused", "ended"],
      default: "draft",
      index: true,
    },
    pausedRemainingMs: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

FlashSaleSchema.index({ status: 1, startTime: 1, endTime: 1 });

export type FlashSaleDocument = InferSchemaType<typeof FlashSaleSchema>;
export const FlashSale = models.FlashSale || model("FlashSale", FlashSaleSchema);
export default FlashSale;
