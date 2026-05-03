import { Schema, model, models, type InferSchemaType } from "mongoose";

const CartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: String, default: "" },
    productSlug: { type: String, default: "" },
    title: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: 0, min: 0 },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    sku: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1 },
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
  },
  { _id: false },
);

const CartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export type CartDocument = InferSchemaType<typeof CartSchema>;
export type CartItemDocument = InferSchemaType<typeof CartItemSchema>;
export const Cart = models.Cart || model("Cart", CartSchema);
