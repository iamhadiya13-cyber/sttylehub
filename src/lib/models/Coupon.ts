import { Schema, model, models, type InferSchemaType } from "mongoose";

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ["percentage", "flat"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, index: true },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    audienceType: {
      type: String,
      enum: ["all", "new_user", "second_order", "repeat_customer", "limited_users"],
      default: "all",
    },
    limitedUserEmails: [{ type: String, lowercase: true, trim: true }],
    perUserLimit: { type: Number, default: 1, min: 0 },
    usedBy: {
      type: [
        new Schema(
          {
            userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
            usageCount: { type: Number, default: 1, min: 0 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    minCompletedOrders: { type: Number, default: 0, min: 0 },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

CouponSchema.index({ "usedBy.userId": 1 });

export type CouponDocument = InferSchemaType<typeof CouponSchema>;
export const Coupon = models.Coupon || model("Coupon", CouponSchema);
export default Coupon;
