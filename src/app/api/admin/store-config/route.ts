import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { getStoreConfig, StoreConfig } from "@/lib/models/StoreConfig";
import { apiErrorFromUnknown } from "@/lib/api";
import { invalidateCache } from "@/lib/cache";
import { createAuditLog } from "@/lib/services/audit-log.service";

const loyaltyRuleSchema = z.object({
  minOrders: z.number().min(0),
  shippingFee: z.number().min(0),
  label: z.string(),
});

const homepageSlideSchema = z.object({
  _id: z.string().optional(),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  subtitle: z.string().default(""),
  ctaLabel: z.string().default(""),
  ctaLink: z.string().default(""),
  image: z.string().default(""),
  product: z.string().nullable().optional().default(""),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

const campaignBannerSchema = z.object({
  _id: z.string().optional(),
  surface: z.enum(["homepage", "featured", "category", "sale"]).default("homepage"),
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  subtitle: z.string().default(""),
  ctaLabel: z.string().default(""),
  ctaLink: z.string().default(""),
  image: z.string().default(""),
  products: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

const storeConfigSchema = z.object({
  defaultShippingFee: z.number().min(0),
  freeShippingThreshold: z.number().min(0),
  platformCommission: z.number().min(0),
  codEnabled: z.boolean(),
  codMaxOrderAmount: z.number().min(0),
  codFee: z.number().min(0),
  lowStockThreshold: z.number().min(0).default(5),
  loyaltyShippingRules: z.array(loyaltyRuleSchema),
  homepageContent: z.object({
    heroTitle: z.string().default(""),
    heroSubtitle: z.string().default(""),
    heroPrimaryCtaLabel: z.string().default(""),
    heroPrimaryCtaLink: z.string().default(""),
    heroSecondaryCtaLabel: z.string().default(""),
    heroSecondaryCtaLink: z.string().default(""),
    heroImage: z.string().default(""),
    saleBannerText: z.string().default(""),
    promoEyebrow: z.string().default(""),
    promoTitle: z.string().default(""),
    promoSubtitle: z.string().default(""),
    promoCardEyebrow: z.string().default(""),
    promoCardTitle: z.string().default(""),
    promoCardSubtitle: z.string().default(""),
    promoCardLink: z.string().default(""),
    featuredCollectionEyebrow: z.string().default(""),
    featuredCollectionTitle: z.string().default(""),
    featuredCollectionSubtitle: z.string().default(""),
    homepageProductPicks: z.array(z.string()).default([]),
    heroSlides: z.array(homepageSlideSchema).default([]),
    campaignBanners: z.array(campaignBannerSchema).default([]),
  }).default({
    heroTitle: "",
    heroSubtitle: "",
    heroPrimaryCtaLabel: "",
    heroPrimaryCtaLink: "",
    heroSecondaryCtaLabel: "",
    heroSecondaryCtaLink: "",
    heroImage: "",
    saleBannerText: "",
    promoEyebrow: "",
    promoTitle: "",
    promoSubtitle: "",
    promoCardEyebrow: "",
    promoCardTitle: "",
    promoCardSubtitle: "",
    promoCardLink: "",
    featuredCollectionEyebrow: "",
    featuredCollectionTitle: "",
    featuredCollectionSubtitle: "",
    homepageProductPicks: [],
    heroSlides: [],
    campaignBanners: [],
  }),
});

export const GET = withAdmin(async () => {
  await connectDB();
  const config = await getStoreConfig();
  return NextResponse.json({
    success: true,
    data: config,
  });
});

export const PUT = withAdmin(async (req, { user }) => {
  try {
    await connectDB();
    const parsedBody = storeConfigSchema.parse(await req.json());
    const body = {
      ...parsedBody,
      homepageContent: {
        ...parsedBody.homepageContent,
        heroSlides: parsedBody.homepageContent.heroSlides.map((slide) => ({
          ...slide,
          product: slide.product || null,
        })),
        campaignBanners: parsedBody.homepageContent.campaignBanners.map((banner) => ({
          ...banner,
          products: banner.products.filter(Boolean),
        })),
      },
    };

    const config = await StoreConfig.findOneAndUpdate(
      { key: "main" },
      {
        $set: {
          ...body,
          key: "main",
          updatedAt: new Date(),
          updatedBy: user.id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await createAuditLog({
      actorId: user.id,
      actorRole: "admin",
      action: "homepage_content_updated",
      entityType: "StoreConfig",
      entityId: String(config._id),
      summary: "Updated homepage campaign and store settings",
      metadata: {
        heroTitle: body.homepageContent.heroTitle,
        featuredCollectionTitle: body.homepageContent.featuredCollectionTitle,
      },
    });
    await Promise.all([
      invalidateCache("homepage:content"),
      invalidateCache("admin:dashboard"),
      invalidateCache("products:featured"),
    ]);

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to update store config");
  }
});
