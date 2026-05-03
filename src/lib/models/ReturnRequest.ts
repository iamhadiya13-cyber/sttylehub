import { Schema, model, models, type InferSchemaType } from "mongoose";

const ReturnRequestItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: String, default: "" },
  },
  { _id: false },
);

const RefundDetailsSchema = new Schema(
  {
    accountHolderName: { type: String, default: "", trim: true },
    bankName: { type: String, default: "", trim: true },
    accountNumber: { type: String, default: "", trim: true },
    ifscCode: { type: String, default: "", trim: true },
    upiId: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const ReturnRequestSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    items: { type: [ReturnRequestItemSchema], default: [], required: true },
    type: { type: String, enum: ["return", "exchange"], required: true, index: true },
    reason: { type: String, required: true, trim: true },
    customReason: { type: String, default: "", trim: true },
    evidenceImages: { type: [String], default: [] },
    refundMethod: {
      type: {
        type: String,
        enum: ["bank", "upi"],
        default: null,
      },
      details: {
        type: RefundDetailsSchema,
        default: () => ({}),
      },
    },
    exchangeVariantId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
      index: true,
    },
    sellerNote: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

ReturnRequestSchema.index({ orderId: 1, sellerId: 1, status: 1 });

export type ReturnRequestDocument = InferSchemaType<typeof ReturnRequestSchema>;
export const ReturnRequest = models.ReturnRequest || model("ReturnRequest", ReturnRequestSchema);
export default ReturnRequest;
