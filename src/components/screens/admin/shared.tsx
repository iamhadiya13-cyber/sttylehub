"use client";

import type { ReactNode } from "react";
import type { Category, Order, Product } from "@/components/screens/shared";
import { formatCurrency } from "@/lib/utils";

export type SellerRecord = {
  _id: string;
  shopName: string;
  description?: string;
  shopCategory?: string;
  phone?: string;
  businessType?: string;
  panNumber?: string;
  gstNumber?: string;
  joinedAt?: string;
  appliedAt?: string;
  approvedAt?: string;
  rejectedAt?: string | null;
  rejectionReason?: string;
  isApproved: boolean;
  isActive: boolean;
  status?: "pending" | "approved" | "rejected";
  totalEarnings?: number;
  productCount?: number;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  user?: { _id?: string; name?: string; email?: string; role?: string; avatar?: string };
};

export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "seller" | "admin";
  avatar?: string;
  createdAt?: string;
  isBanned?: boolean;
};

export type CouponRecord = {
  _id: string;
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  expiryDate?: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  audienceType?: "all" | "new_user" | "second_order" | "repeat_customer" | "limited_users";
  limitedUserEmails?: string[];
  perUserLimit?: number;
  minCompletedOrders?: number;
  applicableCategories?: string[];
};

export type CouponAnalytics = {
  activeCount: number;
  expiredCount: number;
  limitReachedCount: number;
  totalRedemptions: number;
  topCoupons: Array<{
    code: string;
    usedCount: number;
    revenueLift: number;
  }>;
  redemptionsTrend: Array<{
    date: string;
    redemptions: number;
  }>;
};

export type HomepageHeroSlideFormState = {
  _id?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  image: string;
  product: string;
  isActive: boolean;
  sortOrder: number;
};

export type HomepageCampaignBannerFormState = {
  _id?: string;
  surface: "homepage" | "featured" | "category" | "sale";
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaLink: string;
  image: string;
  products: string[];
  isActive: boolean;
  sortOrder: number;
};

export type StoreConfigRecord = {
  key?: string;
  defaultShippingFee: number;
  freeShippingThreshold: number;
  loyaltyShippingRules: Array<{
    minOrders: number;
    shippingFee: number;
    label: string;
  }>;
  platformCommission: number;
  codEnabled: boolean;
  codMaxOrderAmount: number;
  codFee: number;
  lowStockThreshold: number;
  homepageContent?: HomepageContentFormState;
};

export type HomepageContentFormState = {
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaLink: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaLink: string;
  heroImage: string;
  saleBannerText: string;
  promoEyebrow: string;
  promoTitle: string;
  promoSubtitle: string;
  promoCardEyebrow: string;
  promoCardTitle: string;
  promoCardSubtitle: string;
  promoCardLink: string;
  featuredCollectionEyebrow: string;
  featuredCollectionTitle: string;
  featuredCollectionSubtitle: string;
  homepageProductPicks: string[];
  heroSlides: HomepageHeroSlideFormState[];
  campaignBanners: HomepageCampaignBannerFormState[];
};

export type AuditLogRecord = {
  _id: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt?: string;
  actor?: { name?: string; email?: string };
};

export type AdminReviewRecord = {
  _id: string;
  title: string;
  comment: string;
  rating: number;
  isApproved: boolean;
  isVerifiedPurchase?: boolean;
  images?: string[];
  createdAt?: string;
  user?: { name?: string; email?: string };
  product?: { title?: string; images?: string[] };
};

export type PaginatedProducts = {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
};

export type PaginatedOrders = {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
};

export type PaginatedUsers = {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
};

export type CouponFormState = {
  code: string;
  discountType: "percentage" | "flat";
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  expiryDate: string;
  usageLimit: string;
  audienceType: "all" | "new_user" | "second_order" | "repeat_customer" | "limited_users";
  limitedUserEmails: string;
  perUserLimit: string;
  minCompletedOrders: string;
  applicableCategories: string[];
  isActive: boolean;
};

export type StoreSettingsFormState = {
  defaultShippingFee: string;
  freeShippingThreshold: string;
  platformCommission: string;
  codEnabled: boolean;
  codMaxOrderAmount: string;
  codFee: string;
  lowStockThreshold: string;
  loyaltyShippingRules: Array<{
    minOrders: string;
    shippingFee: string;
    label: string;
  }>;
  homepageContent: HomepageContentFormState;
};

const badgeStyles: Record<string, string> = {
  pending: "bg-[#4F46E5]/14 text-[#C7D2FE]",
  confirmed: "bg-blue-500/15 text-blue-300",
  processing: "bg-purple-500/15 text-purple-300",
  shipped: "bg-cyan-500/15 text-cyan-300",
  delivered: "bg-green-500/15 text-green-300",
  cancelled: "bg-red-500/15 text-red-300",
  returned: "bg-red-500/15 text-red-300",
  paid: "bg-green-500/15 text-green-300",
  failed: "bg-red-500/15 text-red-300",
  refunded: "bg-red-500/15 text-red-300",
};

export function getInitialCouponForm(): CouponFormState {
  return {
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    expiryDate: "",
    usageLimit: "",
    audienceType: "all",
    limitedUserEmails: "",
    perUserLimit: "1",
    minCompletedOrders: "",
    applicableCategories: [],
    isActive: true,
  };
}

export function getInitialStoreSettingsForm(config?: StoreConfigRecord): StoreSettingsFormState {
  return {
    defaultShippingFee: config ? String(config.defaultShippingFee) : "49",
    freeShippingThreshold: config ? String(config.freeShippingThreshold) : "499",
    platformCommission: config ? String(config.platformCommission) : "10",
    codEnabled: config?.codEnabled ?? true,
    codMaxOrderAmount: config ? String(config.codMaxOrderAmount) : "5000",
    codFee: config ? String(config.codFee) : "0",
    lowStockThreshold: config ? String(config.lowStockThreshold ?? 5) : "5",
    loyaltyShippingRules: config?.loyaltyShippingRules?.length
      ? config.loyaltyShippingRules.map((rule) => ({
          minOrders: String(rule.minOrders),
          shippingFee: String(rule.shippingFee),
          label: rule.label,
        }))
      : [
          { minOrders: "3", shippingFee: "29", label: "3+ orders: Rs 29 shipping" },
          { minOrders: "5", shippingFee: "0", label: "5+ orders: Free shipping" },
          { minOrders: "10", shippingFee: "0", label: "10+ orders: Always free" },
        ],
    homepageContent: {
      heroTitle: config?.homepageContent?.heroTitle || "WEAR YOUR\nIDENTITY",
      heroSubtitle:
        config?.homepageContent?.heroSubtitle ||
        "Premium streetwear delivered to your door with bold silhouettes, live inventory, and weekly drops that feel editorial from the first click.",
      heroPrimaryCtaLabel: config?.homepageContent?.heroPrimaryCtaLabel || "Shop Now",
      heroPrimaryCtaLink: config?.homepageContent?.heroPrimaryCtaLink || "/products",
      heroSecondaryCtaLabel: config?.homepageContent?.heroSecondaryCtaLabel || "Explore Looks",
      heroSecondaryCtaLink: config?.homepageContent?.heroSecondaryCtaLink || "/search",
      heroImage: config?.homepageContent?.heroImage || "",
      saleBannerText:
        config?.homepageContent?.saleBannerText ||
        "FREE SHIPPING ABOVE Rs 499 * NEW ARRIVALS WEEKLY * STREETWEAR CULTURE * EXCLUSIVE DROPS *",
      promoEyebrow: config?.homepageContent?.promoEyebrow || "Season Sale",
      promoTitle: config?.homepageContent?.promoTitle || "Up To 50% Off",
      promoSubtitle:
        config?.homepageContent?.promoSubtitle ||
        "Selected streetwear staples are marked down right now. Hoodies, cargos, sneakers, and everyday layers are all in the current sale edit.",
      promoCardEyebrow: config?.homepageContent?.promoCardEyebrow || "Limited Edit",
      promoCardTitle: config?.homepageContent?.promoCardTitle || "Shop Sale",
      promoCardSubtitle:
        config?.homepageContent?.promoCardSubtitle ||
        "Best markdowns across statement pieces and daily essentials.",
      promoCardLink: config?.homepageContent?.promoCardLink || "/products?sort=price-desc",
      featuredCollectionEyebrow: config?.homepageContent?.featuredCollectionEyebrow || "Best Picks",
      featuredCollectionTitle: config?.homepageContent?.featuredCollectionTitle || "Featured Products",
      featuredCollectionSubtitle:
        config?.homepageContent?.featuredCollectionSubtitle ||
        "Admin-curated streetwear picks for the current campaign.",
      homepageProductPicks: config?.homepageContent?.homepageProductPicks || [],
      heroSlides: config?.homepageContent?.heroSlides?.length
        ? config.homepageContent.heroSlides.map((slide) => ({
            ...slide,
            product: slide.product || "",
          }))
        : [],
      campaignBanners: config?.homepageContent?.campaignBanners?.length
        ? config.homepageContent.campaignBanners.map((banner) => ({
            ...banner,
            products: banner.products || [],
          }))
        : [],
    },
  };
}

export function statusBadge(status: string) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${badgeStyles[status] || "bg-white/10 text-white"}`}>{status}</span>;
}

export function tableWrap(children: ReactNode) {
  return <div className="mt-6 overflow-hidden rounded-3xl border border-[#1F1F1F] bg-[#111111]">{children}</div>;
}

export function tableCell(children: ReactNode, className = "") {
  return <td className={`px-4 py-4 align-top text-sm text-white ${className}`}>{children}</td>;
}

export function tableHead(children: ReactNode, className = "") {
  return <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[#888888] ${className}`}>{children}</th>;
}

export function timeAgo(value?: string) {
  if (!value) return "Just now";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function couponAudienceSummary(coupon: CouponRecord) {
  return (
    <div>
      <p>{coupon.audienceType || "all"}</p>
      <p className="text-xs text-[#888888]">Orders = {coupon.minCompletedOrders || 0}</p>
    </div>
  );
}

export function couponValueLabel(coupon: CouponRecord) {
  return coupon.discountType === "percentage"
    ? `${coupon.discountValue}%`
    : formatCurrency(coupon.discountValue);
}

