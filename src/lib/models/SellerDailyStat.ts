import { Schema, model, models, type InferSchemaType } from "mongoose";

const SellerDailyStatSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    date: { type: Date, required: true, index: true },
    revenue: { type: Number, default: 0 },
    orders: { type: Number, default: 0 },
    unitsSold: { type: Number, default: 0 },
  },
  { timestamps: true },
);

SellerDailyStatSchema.index({ seller: 1, date: 1 }, { unique: true });

export type SellerDailyStatDocument = InferSchemaType<typeof SellerDailyStatSchema>;
export const SellerDailyStat = models.SellerDailyStat || model("SellerDailyStat", SellerDailyStatSchema);
