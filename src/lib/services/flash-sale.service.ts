import type { Types } from "mongoose";
import { CACHE_TTLS, withCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { FlashSale } from "@/lib/models/FlashSale";
import type { ProductDocument } from "@/lib/models/Product";
import {
  getDisplayPricingForProduct,
  getVariantCompareAtPrice,
  getVariantSalePrice,
  type ProductVariant,
} from "@/lib/product-variants";

type ProductLike = {
  _id: string | Types.ObjectId;
  price: number;
  discountPrice: number;
  variants?: ProductVariant[];
  title?: string;
  slug?: string;
  [key: string]: unknown;
};

export type FlashSaleSummary = {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  discountPercent: number;
  productIds: string[];
  status: "draft" | "active" | "paused" | "ended";
  pausedRemainingMs?: number;
};

function normalizeFlashSale(raw: {
  _id: Types.ObjectId | string;
  name: string;
  startTime: Date | string;
  endTime: Date | string;
  discountPercent: number;
  productIds: Array<Types.ObjectId | string>;
  status: "draft" | "active" | "paused" | "ended";
  pausedRemainingMs?: number;
} | null): FlashSaleSummary | null {
  if (!raw) {
    return null;
  }

  return {
    _id: String(raw._id),
    name: raw.name,
    startTime: new Date(raw.startTime).toISOString(),
    endTime: new Date(raw.endTime).toISOString(),
    discountPercent: Number(raw.discountPercent || 0),
    productIds: (raw.productIds || []).map((id) => String(id)),
    status: raw.status,
    pausedRemainingMs: Number(raw.pausedRemainingMs || 0),
  };
}

export function getFlashSaleDiscountedPrice(basePrice: number, discountPercent: number) {
  const nextPrice = Math.round(basePrice * (1 - discountPercent / 100));
  return Math.max(0, nextPrice);
}

export async function getLatestFlashSaleForAdmin() {
  if (!process.env.MONGODB_URI) {
    return null;
  }
  await connectDB();
  const sale = await FlashSale.findOne()
    .sort({ createdAt: -1 })
    .lean<{
      _id: Types.ObjectId | string;
      name: string;
      startTime: Date | string;
      endTime: Date | string;
      discountPercent: number;
      productIds: Array<Types.ObjectId | string>;
      status: "draft" | "active" | "paused" | "ended";
      pausedRemainingMs?: number;
    } | null>();

  return normalizeFlashSale(sale);
}

export async function getActiveFlashSaleDirect(now = new Date()) {
  if (!process.env.MONGODB_URI) {
    return null;
  }
  await connectDB();
  const sale = await FlashSale.findOne({
    status: "active",
    startTime: { $lte: now },
    endTime: { $gt: now },
  })
    .sort({ startTime: -1 })
    .lean<{
      _id: Types.ObjectId | string;
      name: string;
      startTime: Date | string;
      endTime: Date | string;
      discountPercent: number;
      productIds: Array<Types.ObjectId | string>;
      status: "draft" | "active" | "paused" | "ended";
      pausedRemainingMs?: number;
    } | null>();

  return normalizeFlashSale(sale);
}

export async function getCachedActiveFlashSale(now = new Date()) {
  return withCache("flash-sale:active", CACHE_TTLS.flashSale, async () => getActiveFlashSaleDirect(now));
}

export function applyFlashSaleToProduct<T extends ProductLike>(product: T, sale: FlashSaleSummary | null): T & {
  flashSale?: {
    id: string;
    name: string;
    endTime: string;
    discountPercent: number;
  } | null;
} {
  if (!sale || !sale.productIds.includes(String(product._id))) {
    return { ...product, flashSale: null };
  }

  const productPricing = getDisplayPricingForProduct({
    variants: product.variants || [],
    price: product.price,
    discountPrice: product.discountPrice,
  });
  const nextDiscountPrice = getFlashSaleDiscountedPrice(productPricing.discountPrice, sale.discountPercent);
  const nextVariants = (product.variants || []).map((variant) => {
    const variantSalePrice = getVariantSalePrice(variant, productPricing.discountPrice);
    const variantCompareAtPrice = getVariantCompareAtPrice(variant, productPricing.price, variantSalePrice);
    return {
      ...variant,
      price: getFlashSaleDiscountedPrice(variantSalePrice, sale.discountPercent),
      compareAtPrice: variantCompareAtPrice,
    };
  });

  return {
    ...product,
    discountPrice: nextDiscountPrice,
    price: productPricing.price,
    variants: nextVariants,
    flashSale: {
      id: sale._id,
      name: sale.name,
      endTime: sale.endTime,
      discountPercent: sale.discountPercent,
    },
  };
}

export function applyFlashSaleToProducts<T extends ProductLike>(products: T[], sale: FlashSaleSummary | null) {
  return products.map((product) => applyFlashSaleToProduct(product, sale));
}

export async function resolveFlashSalePricingForProduct(
  product: ProductDocument & { id: string },
  variant: ProductVariant | null,
  now = new Date(),
) {
  const sale = await getActiveFlashSaleDirect(now);
  const baseSalePrice = getVariantSalePrice(variant, product.discountPrice || product.price);
  const baseCompareAtPrice = getVariantCompareAtPrice(
    variant,
    product.price || baseSalePrice,
    baseSalePrice,
  );

  if (!sale || !sale.productIds.includes(product.id)) {
    return {
      sale,
      price: baseCompareAtPrice,
      discountPrice: baseSalePrice,
    };
  }

  return {
    sale,
    price: baseCompareAtPrice,
    discountPrice: getFlashSaleDiscountedPrice(baseSalePrice, sale.discountPercent),
  };
}
