import mongoose, { Schema, type InferSchemaType } from "mongoose";

const LoyaltyShippingRuleSchema = new Schema(
  {
    minOrders: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    label: { type: String, default: "" },
  },
  { _id: false },
);

const HomepageContentSchema = new Schema(
  {
    heroTitle: { type: String, default: "" },
    heroSubtitle: { type: String, default: "" },
    heroPrimaryCtaLabel: { type: String, default: "" },
    heroPrimaryCtaLink: { type: String, default: "" },
    heroSecondaryCtaLabel: { type: String, default: "" },
    heroSecondaryCtaLink: { type: String, default: "" },
    heroImage: { type: String, default: "" },
    saleBannerText: { type: String, default: "" },
    promoEyebrow: { type: String, default: "" },
    promoTitle: { type: String, default: "" },
    promoSubtitle: { type: String, default: "" },
    promoCardEyebrow: { type: String, default: "" },
    promoCardTitle: { type: String, default: "" },
    promoCardSubtitle: { type: String, default: "" },
    promoCardLink: { type: String, default: "" },
    featuredCollectionEyebrow: { type: String, default: "" },
    featuredCollectionTitle: { type: String, default: "" },
    featuredCollectionSubtitle: { type: String, default: "" },
    homepageProductPicks: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    heroSlides: {
      type: [
        new Schema(
          {
            eyebrow: { type: String, default: "" },
            title: { type: String, default: "" },
            subtitle: { type: String, default: "" },
            ctaLabel: { type: String, default: "" },
            ctaLink: { type: String, default: "" },
            image: { type: String, default: "" },
            product: { type: Schema.Types.ObjectId, ref: "Product", default: null },
            isActive: { type: Boolean, default: true },
            sortOrder: { type: Number, default: 0 },
          },
          { _id: true },
        ),
      ],
      default: [],
    },
    campaignBanners: {
      type: [
        new Schema(
          {
            surface: {
              type: String,
              enum: ["homepage", "featured", "category", "sale"],
              default: "homepage",
            },
            eyebrow: { type: String, default: "" },
            title: { type: String, default: "" },
            subtitle: { type: String, default: "" },
            ctaLabel: { type: String, default: "" },
            ctaLink: { type: String, default: "" },
            image: { type: String, default: "" },
            products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
            isActive: { type: Boolean, default: true },
            sortOrder: { type: Number, default: 0 },
          },
          { _id: true },
        ),
      ],
      default: [],
    },
  },
  { _id: false },
);

const storeConfigSchema = new Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
    },
    defaultShippingFee: {
      type: Number,
      default: 49,
    },
    freeShippingThreshold: {
      type: Number,
      default: 499,
    },
    loyaltyShippingRules: {
      type: [LoyaltyShippingRuleSchema],
      default: [],
    },
    platformCommission: {
      type: Number,
      default: 10,
    },
    codEnabled: { type: Boolean, default: true },
    codMaxOrderAmount: { type: Number, default: 5000 },
    codFee: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    homepageContent: {
      type: HomepageContentSchema,
      default: () => ({}),
    },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export type StoreConfigDocument = InferSchemaType<typeof storeConfigSchema>;

export const StoreConfig =
  mongoose.models.StoreConfig || mongoose.model("StoreConfig", storeConfigSchema);

export async function getStoreConfig() {
  let config = await StoreConfig.findOne({ key: "main" });
  if (!config) {
    config = await StoreConfig.create({
      key: "main",
      defaultShippingFee: 49,
      freeShippingThreshold: 499,
      loyaltyShippingRules: [
        { minOrders: 5, shippingFee: 0, label: "5+ orders: Free shipping" },
      ],
      platformCommission: 10,
    });
  }
  return config;
}

export default StoreConfig;
