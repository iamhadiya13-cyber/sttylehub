import { Schema, model, models, type InferSchemaType } from "mongoose";

const CouponRedemptionSchema = new Schema(
  {
    coupon: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

CouponRedemptionSchema.index({ coupon: 1, user: 1 });
CouponRedemptionSchema.index({ coupon: 1, createdAt: -1 });

export type CouponRedemptionDocument = InferSchemaType<typeof CouponRedemptionSchema>;
export const CouponRedemption =
  models.CouponRedemption || model("CouponRedemption", CouponRedemptionSchema);
export default CouponRedemption;
