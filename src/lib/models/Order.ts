import { Schema, model, models, type InferSchemaType } from "mongoose";

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productSlug: { type: String, default: "" },
    variantId: { type: String, default: "" },
    title: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: 0, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
    sku: { type: String, default: "" },
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
  },
  { _id: false },
);

const ShippingAddressSchema = new Schema(
  {
    label: { type: String, required: true, default: "Home" },
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    street: { type: String, required: true },
    locality: { type: String, default: "" },
    landmark: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const OrderStatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [OrderItemSchema], required: true, default: [] },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ["razorpay", "stripe", "cod"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],
      default: "pending",
      index: true,
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    coupon: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    stripePaymentIntentId: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    carrier: { type: String, default: null },
    cancelReason: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ["customer", "admin"], default: null },
    deliveredAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
    statusHistory: { type: [OrderStatusHistorySchema], default: [] },
  },
  { timestamps: true },
);

export type OrderDocument = InferSchemaType<typeof OrderSchema>;
export type OrderItemDocument = InferSchemaType<typeof OrderItemSchema>;
export const Order = models.Order || model("Order", OrderSchema);
export default Order;
