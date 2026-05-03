const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  return (process.env.NEXTAUTH_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function getSiteUrlObject() {
  return new URL(getSiteUrl());
}

export function absoluteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}

export function productImageAlt(
  product: { title: string; brand?: string | null },
  color?: string | null,
) {
  const brand = product.brand?.trim() || "StyleHub";
  const colorSuffix = color?.trim() ? ` in ${color.trim()}` : "";
  return `${product.title} by ${brand}${colorSuffix}`;
}

export function truncateSeoText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function formatExpiryDaysLabel(expiryDate?: string | Date | null) {
  if (!expiryDate) {
    return "";
  }

  const now = Date.now();
  const target = new Date(expiryDate).getTime();
  const diffDays = Math.max(0, Math.ceil((target - now) / 86_400_000));
  return `Expires in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
}
