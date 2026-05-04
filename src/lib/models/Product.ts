import {
  Schema,
  model,
  models,
  type InferSchemaType,
} from "mongoose";
import {
  APPAREL_SIZES,
  EXTENDED_SIZES,
  getDisplayPricingForProduct,
  syncVariantsForProduct,
} from "@/lib/product-variants";

const ProductColorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const ProductVariantSchema = new Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true,
      enum: [...EXTENDED_SIZES],
    },
    color: {
      type: ProductColorSchema,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      min: 0,
      default: null,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    weight: {
      type: Number,
      min: 0,
      default: null,
    },
    barcode: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true },
);

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0, index: true },
    discountPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0 },
    images: [{ type: String, required: true }],
    colorImages: {
      type: Map,
      of: [String],
      default: new Map(),
    },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, required: true, trim: true },
    gender: {
      type: String,
      enum: ["men", "women", "unisex"],
      default: "unisex",
      required: true,
      index: true,
    },
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    variants: {
      type: [ProductVariantSchema],
      default: [],
    },
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    sizes: {
      type: [String],
      default: [...APPAREL_SIZES],
    },
    colors: {
      type: [ProductColorSchema],
      default: [],
    },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false, index: true },
    displayPriority: { type: Number, default: 0, index: true },
    campaignKey: { type: String, default: "", trim: true, index: true },
    archivedAt: { type: Date, default: null },
    acceptedPayments: {
      razorpay: { type: Boolean, default: true },
      stripe: { type: Boolean, default: true },
      cod: { type: Boolean, default: true },
    },
    returnAllowed: { type: Boolean, default: false },
    returnWindowDays: { type: Number, default: 7, min: 1, max: 30 },
    exchangeAllowed: { type: Boolean, default: false },
    exchangeWindowDays: { type: Number, default: 7, min: 1, max: 30 },
    tags: [{ type: String, trim: true }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    totalSold: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

ProductSchema.index({ title: 1 });
ProductSchema.index({ isPublished: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ seller: 1 });
ProductSchema.index({ totalStock: 1 });
ProductSchema.index({ "variants.sku": 1 });
ProductSchema.index({ isFeatured: 1, displayPriority: -1, createdAt: -1 });
ProductSchema.index({ campaignKey: 1, displayPriority: -1 });

function prepareProduct(this: InferSchemaType<typeof ProductSchema>) {
  syncVariantsForProduct(this);
  if (this.variants?.length) {
    const pricing = getDisplayPricingForProduct(this);
    this.price = pricing.price;
    this.discountPrice = pricing.discountPrice;
  }
  const discount = this.price > 0 ? ((this.price - this.discountPrice) / this.price) * 100 : 0;
  this.discountPercent = Math.max(0, Math.round(discount));
}

ProductSchema.pre<InferSchemaType<typeof ProductSchema>>("validate", function productPreValidate(
  this: InferSchemaType<typeof ProductSchema>,
) {
  prepareProduct.call(this);
});

ProductSchema.pre<InferSchemaType<typeof ProductSchema>>("save", function productPreSave(
  this: InferSchemaType<typeof ProductSchema>,
) {
  prepareProduct.call(this);
});

export type ProductDocument = InferSchemaType<typeof ProductSchema>;
export const Product = models.Product || model("Product", ProductSchema);
export default Product;
