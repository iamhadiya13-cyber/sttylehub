import { Schema, model, models, type InferSchemaType } from "mongoose";

const SellerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    shopName: { type: String, required: true, trim: true },
    shopSlug: { type: String, unique: true, index: true, sparse: true },
    shopLogo: { type: String, default: "" },
    shopBanner: { type: String, default: "" },
    description: { type: String, default: "" },
    shopCategory: { type: String, default: "", trim: true, index: true },
    phone: { type: String, default: "", trim: true },
    businessType: {
      type: String,
      enum: ["individual", "sole_prop", "private_ltd", "partnership"],
      default: "individual",
    },
    panNumber: { type: String, default: "", trim: true },
    isApproved: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: false, index: true },
    totalEarnings: { type: Number, default: 0, min: 0 },
    pendingPayout: { type: Number, default: 0, min: 0 },
    bankDetails: {
      accountName: { type: String, default: "" },
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
    },
    gstNumber: { type: String, default: "", trim: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    appliedAt: { type: Date, default: Date.now, index: true },
    approvedAt: { type: Date },
    rejectedAt: { type: Date, index: true },
    rejectionReason: { type: String },
  },
  { timestamps: { createdAt: "joinedAt", updatedAt: true } },
);

export type SellerDocument = InferSchemaType<typeof SellerSchema>;
export const Seller = models.Seller || model("Seller", SellerSchema);
export default Seller;
