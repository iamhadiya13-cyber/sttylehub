export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const EXTENDED_SIZES = [...APPAREL_SIZES, "UK6", "UK7", "UK8", "UK9", "UK10", "UK11", "S/M", "L/XL", "One Size"] as const;

export type ProductColor = {
  name: string;
  hex: string;
};

export type ProductVariant = {
  _id?: string | { toString(): string };
  size: string;
  color: ProductColor;
  stock: number;
  sku?: string;
  price?: number | null;
  compareAtPrice?: number | null;
  image?: string;
  isActive?: boolean;
  weight?: number | null;
  barcode?: string;
};

export type AcceptedPayments = {
  upi: boolean;
  creditCard: boolean;
  cod: boolean;
};

export function normalizeColorName(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeSize(value: string) {
  return value.trim().toUpperCase();
}

export function buildVariantSku(slug: string, colorName: string, size: string) {
  const safeColor = normalizeColorName(colorName).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const safeSize = size.trim().replace(/[^a-zA-Z0-9]+/g, "-");
  return `${slug}-${safeColor}-${safeSize}`;
}

export function getUniqueSizes(variants: ProductVariant[]) {
  return [...new Set(variants.map((variant) => variant.size).filter(Boolean))];
}

export function getUniqueColors(variants: ProductVariant[]) {
  const map = new Map<string, ProductColor>();
  variants.forEach((variant) => {
    const key = normalizeColorName(variant.color.name);
    if (!map.has(key)) {
      map.set(key, { name: variant.color.name, hex: variant.color.hex });
    }
  });
  return [...map.values()];
}

export function getTotalStock(variants: ProductVariant[]) {
  return variants.reduce(
    (sum, variant) =>
      sum + (variant.isActive === false ? 0 : Math.max(0, variant.stock || 0)),
    0,
  );
}

export function isVariantActive(variant?: ProductVariant | null) {
  return Boolean(variant && variant.isActive !== false);
}

export function getVariantSalePrice(
  variant: ProductVariant | undefined | null,
  fallbackPrice: number,
) {
  if (variant?.price != null && variant.price >= 0) {
    return Number(variant.price);
  }
  return fallbackPrice;
}

export function getVariantCompareAtPrice(
  variant: ProductVariant | undefined | null,
  fallbackCompareAtPrice: number,
  salePrice: number,
) {
  const candidate =
    variant?.compareAtPrice != null && variant.compareAtPrice > 0
      ? Number(variant.compareAtPrice)
      : fallbackCompareAtPrice;
  return candidate >= salePrice ? candidate : salePrice;
}

export function getDisplayPricingForProduct<T extends { variants?: ProductVariant[]; price: number; discountPrice: number }>(
  product: T,
) {
  const activeVariants = (product.variants || []).filter(
    (variant) => isVariantActive(variant),
  );
  if (!activeVariants.length) {
    return {
      price: product.price,
      discountPrice: product.discountPrice || product.price,
    };
  }

  const pricing = activeVariants.map((variant) => {
    const discountPrice = getVariantSalePrice(variant, product.discountPrice || product.price);
    const price = getVariantCompareAtPrice(variant, product.price || discountPrice, discountPrice);
    return { price, discountPrice };
  });

  const cheapest = pricing.reduce((lowest, current) =>
    current.discountPrice < lowest.discountPrice ? current : lowest,
  );

  return cheapest;
}

export function getVariantIdentifier(variant: ProductVariant) {
  return (
    (typeof variant._id === "string" ? variant._id : variant._id?.toString()) ||
    `${normalizeColorName(variant.color.name)}::${normalizeSize(variant.size)}`
  );
}

export function syncVariantsForProduct<T extends { slug?: string; variants?: ProductVariant[]; sizes?: string[]; colors?: ProductColor[]; totalStock?: number }>(product: T) {
  const variants = (product.variants || []).map((variant) => ({
    ...variant,
    size: variant.size.trim(),
    color: {
      name: variant.color.name.trim(),
      hex: variant.color.hex.trim(),
    },
    stock: Math.max(0, Number(variant.stock || 0)),
    sku: variant.sku || buildVariantSku(product.slug || "product", variant.color.name, variant.size),
    price: variant.price == null ? null : Math.max(0, Number(variant.price)),
    compareAtPrice:
      variant.compareAtPrice == null ? null : Math.max(0, Number(variant.compareAtPrice)),
    image: variant.image?.trim?.() || "",
    isActive: variant.isActive !== false,
    weight: variant.weight == null ? null : Math.max(0, Number(variant.weight)),
    barcode: variant.barcode?.trim?.() || "",
  }));

  product.variants = variants;
  product.totalStock = getTotalStock(variants);
  product.sizes = getUniqueSizes(variants);
  product.colors = getUniqueColors(variants);
  return product;
}

export function findVariant(variants: ProductVariant[], size?: string, colorName?: string) {
  if (!size || !colorName) return undefined;
  const normalizedSize = normalizeSize(size);
  const normalizedColor = normalizeColorName(colorName);
  return variants.find(
    (variant) => normalizeSize(variant.size) === normalizedSize && normalizeColorName(variant.color.name) === normalizedColor,
  );
}

export function findVariantById(
  variants: ProductVariant[],
  variantId?: string,
) {
  if (!variantId) return undefined;
  return variants.find((variant) => {
    const currentId =
      typeof variant._id === "string" ? variant._id : variant._id?.toString();
    return currentId === variantId;
  });
}

export function resolveVariant(
  variants: ProductVariant[],
  options: { variantId?: string; size?: string; colorName?: string },
) {
  return (
    findVariantById(variants, options.variantId) ||
    findVariant(variants, options.size, options.colorName)
  );
}
