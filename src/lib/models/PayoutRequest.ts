import { Schema, model, models, type InferSchemaType } from "mongoose";

const PayoutRequestSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending", index: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export type PayoutRequestDocument = InferSchemaType<typeof PayoutRequestSchema>;
export const PayoutRequest = models.PayoutRequest || model("PayoutRequest", PayoutRequestSchema);
