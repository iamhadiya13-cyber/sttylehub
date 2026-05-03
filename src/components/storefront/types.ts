"use client";

export type Category = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  gender?: "men" | "women" | "unisex" | "all";
};

export type SellerInfo = {
  _id?: string;
  shopName?: string;
  user?: { name?: string };
};

export type Product = {
  _id: string;
  title: string;
  slug: string;
  brand: string;
  shortDescription: string;
  description?: string;
  fitNotes?: string;
  price: number;
  discountPrice: number;
  discountPercent?: number;
  images: string[];
  colorImages?: Record<string, string[]>;
  gender?: "men" | "women" | "unisex";
  acceptedPayments?: {
    razorpay: boolean;
    stripe: boolean;
    cod: boolean;
  };
  returnAllowed?: boolean;
  returnWindowDays?: number;
  exchangeAllowed?: boolean;
  exchangeWindowDays?: number;
  averageRating?: number;
  totalReviews?: number;
  totalSold?: number;
  stock?: number;
  totalStock?: number;
  tags?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  displayPriority?: number;
  campaignKey?: string;
  archivedAt?: string | null;
  category?: Category | null;
  seller?: SellerInfo | null;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  variants?: {
    _id?: string;
    size: string;
    color: { name: string; hex: string };
    stock: number;
    sku?: string;
    price: number;
    compareAtPrice?: number | null;
    image?: string;
    isActive?: boolean;
    weight?: number | null;
    barcode?: string;
  }[];
  flashSale?: {
    id: string;
    name: string;
    endTime: string;
    discountPercent: number;
  } | null;
  createdAt?: string;
};

export type Address = {
  _id: string;
  label: string;
  fullName?: string;
  phone?: string;
  street: string;
  locality?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  addressType?: "Home" | "Work" | "Other";
  isDefault?: boolean;
};

export type Profile = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  genderPreference?: "men" | "women" | "unisex";
  role?: string;
  isVerified?: boolean;
  verificationResendCooldown?: number;
  addresses: Address[];
};

export type Review = {
  _id: string;
  title: string;
  comment: string;
  rating: number;
  createdAt: string;
  isVerifiedPurchase?: boolean;
  user?: { name?: string; avatar?: string };
};

export type OrderItem = {
  product?: Product | null;
  seller?: { _id?: string; shopName?: string; user?: string };
  productSlug?: string;
  variantId?: string;
  title: string;
  image: string;
  price: number;
  discountPrice?: number;
  compareAtPrice?: number;
  qty: number;
  size?: string;
  color?: string;
  sku?: string;
};

export type Order = {
  _id: string;
  orderNumber: string;
  createdAt: string;
  deliveredAt?: string;
  returnedAt?: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  trackingNumber?: string;
  carrier?: string;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: "customer" | "admin";
  statusHistory?: {
    status: string;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }[];
  shippingAddress: Address;
  items: OrderItem[];
  user?: { name?: string; email?: string };
};

export type SearchFilters = {
  q: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  sizes: string[];
  categories: string[];
  gender: "all" | "men" | "women" | "unisex";
};

export const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
export const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Price Low-High", value: "price-asc" },
  { label: "Price High-Low", value: "price-desc" },
  { label: "Top Rated", value: "top-rated" },
  { label: "Best Selling", value: "best-selling" },
];
export const orderTabs = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
export const genderTabs = [
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Unisex", value: "unisex" },
] as const;
