export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
  color: string;
  revenue: number;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice: number;
  brand: string;
  category: string;
  categorySlug: string;
  stock: number;
  totalSold: number;
  rating: number;
  tags: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  featured?: boolean;
  isNew?: boolean;
};

export type Order = {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  items: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  time: string;
  seller: string;
};

const image = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=1200&q=80`;

export const categories: Category[] = [
{ id: "c1", name: "Oversized Tees", slug: "oversized-tees", image: image("photo-1521572163474-6864f9cf17ab"), color: "#6366F1", revenue: 620000 },
  { id: "c2", name: "Cargo Pants", slug: "cargo-pants", image: image("photo-1515886657613-9f3515b0c78f"), color: "#FF4500", revenue: 510000 },
  { id: "c3", name: "Sneakers", slug: "sneakers", image: image("photo-1542291026-7eec264c27ff"), color: "#8B5CF6", revenue: 780000 },
  { id: "c4", name: "Outerwear", slug: "outerwear", image: image("photo-1523398002811-999ca8dec234"), color: "#06B6D4", revenue: 430000 },
];

export const products: Product[] = [
  {
    id: "p1",
    title: "Tokyo Drift Graphic Tee",
    slug: "tokyo-drift-graphic-tee",
    description: "Heavyweight cotton tee with washed street poster artwork, oversized shoulders and dropped hem.",
    shortDescription: "Heavyweight oversized tee with washed graphic print.",
    price: 2999,
    discountPrice: 2299,
    brand: "StyleHub Lab",
    category: "Oversized Tees",
    categorySlug: "oversized-tees",
    stock: 18,
    totalSold: 210,
    rating: 4.8,
    tags: ["new", "graphic", "oversized"],
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Midnight", hex: "#0F172A" }, { name: "Bone", hex: "#E7E5E4" }],
    images: [image("photo-1521572163474-6864f9cf17ab"), image("photo-1503342217505-b0a15ec3261c")],
    featured: true,
    isNew: true,
  },
  {
    id: "p2",
    title: "Utility Runner Cargo",
    slug: "utility-runner-cargo",
    description: "Tapered cargo with articulated knees, adjustable cuffs and reflective taping.",
    shortDescription: "Tapered cargo pants with reflective utility details.",
    price: 4999,
    discountPrice: 4199,
    brand: "Vault Street",
    category: "Cargo Pants",
    categorySlug: "cargo-pants",
    stock: 9,
    totalSold: 172,
    rating: 4.6,
    tags: ["utility", "cargo"],
    sizes: ["M", "L", "XL"],
    colors: [{ name: "Olive", hex: "#4D7C0F" }, { name: "Coal", hex: "#1F2937" }],
    images: [image("photo-1515886657613-9f3515b0c78f"), image("photo-1507679799987-c73779587ccf")],
    featured: true,
  },
  {
    id: "p3",
    title: "Neon Edge High-Top",
    slug: "neon-edge-high-top",
    description: "High-top sneaker with translucent sole, neon lace cage and padded ankle collar.",
    shortDescription: "Statement high-top sneaker with neon cage.",
    price: 7999,
    discountPrice: 6999,
    brand: "Concrete Motion",
    category: "Sneakers",
    categorySlug: "sneakers",
    stock: 6,
    totalSold: 131,
    rating: 4.9,
    tags: ["sneakers", "limited"],
    sizes: ["7", "8", "9", "10"],
    colors: [{ name: "Volt", hex: "#D9F99D" }, { name: "Jet", hex: "#111827" }],
    images: [image("photo-1542291026-7eec264c27ff"), image("photo-1600185365483-26d7a4cc7519")],
    featured: true,
    isNew: true,
  },
  {
    id: "p4",
    title: "After Hours Bomber",
    slug: "after-hours-bomber",
    description: "Padded satin bomber jacket with contrast sleeve piping and oversized back embroidery.",
    shortDescription: "Padded bomber jacket with embroidered back graphic.",
    price: 8999,
    discountPrice: 7599,
    brand: "Nightshift",
    category: "Outerwear",
    categorySlug: "outerwear",
    stock: 14,
    totalSold: 87,
    rating: 4.7,
    tags: ["outerwear", "bomber"],
    sizes: ["M", "L", "XL"],
    colors: [{ name: "Black", hex: "#09090B" }, { name: "Crimson", hex: "#B91C1C" }],
    images: [image("photo-1523398002811-999ca8dec234"), image("photo-1529139574466-a303027c1d8b")],
  },
];

export const orders: Order[] = [
  { id: "o1", orderNumber: "SH-3021", customer: "Aarav Singh", total: 7298, items: 2, status: "processing", time: "12m ago", seller: "Nightshift" },
  { id: "o2", orderNumber: "SH-3019", customer: "Priya Sharma", total: 4199, items: 1, status: "confirmed", time: "28m ago", seller: "Vault Street" },
  { id: "o3", orderNumber: "SH-3017", customer: "Rohan Kapoor", total: 6999, items: 1, status: "delivered", time: "1h ago", seller: "Concrete Motion" },
  { id: "o4", orderNumber: "SH-3015", customer: "Zara Khan", total: 9898, items: 3, status: "pending", time: "2h ago", seller: "StyleHub Lab" },
  { id: "o5", orderNumber: "SH-3011", customer: "Ishita Mehta", total: 7599, items: 1, status: "shipped", time: "3h ago", seller: "Nightshift" },
];

export const adminOverview = {
  totalRevenue: 2840000,
  totalOrders: 1284,
  totalUsers: 9421,
  totalProducts: 368,
  avgOrderValue: 2212,
  conversionRate: 4.8,
  pendingSellerApprovals: 12,
  pendingReviews: 19,
};

export const sellerOverview = {
  totalRevenue: 428000,
  totalOrders: 189,
  totalProducts: 22,
  pendingOrders: 14,
  totalEarnings: 712000,
  pendingPayout: 86000,
  thisMonthRevenue: 428000,
  lastMonthRevenue: 367000,
  revenueGrowthPercent: 16.6,
  avgOrderValue: 2265,
};

export const revenueChart = Array.from({ length: 30 }, (_, index) => ({
  day: `Day ${index + 1}`,
  revenue: 40000 + Math.round(Math.sin(index / 3) * 9000 + index * 1200),
  orders: 18 + (index % 7) * 3,
  users: 14 + (index % 5) * 4,
}));

export const monthlyRevenue = Array.from({ length: 12 }, (_, index) => ({
  month: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][index],
  thisYear: 110000 + index * 23000,
  lastYear: 90000 + index * 18000,
}));

export const paymentBreakdown = [
  { name: "Razorpay", value: 46 },
  { name: "Stripe", value: 31 },
  { name: "COD", value: 23 },
];

export const orderStatusBreakdown = [
  { name: "Pending", value: 82, color: "#F59E0B" },
  { name: "Confirmed", value: 148, color: "#3B82F6" },
  { name: "Processing", value: 196, color: "#8B5CF6" },
  { name: "Shipped", value: 230, color: "#06B6D4" },
  { name: "Delivered", value: 540, color: "#22C55E" },
  { name: "Cancelled", value: 88, color: "#EF4444" },
];

export const heatmapData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].flatMap((day, y) =>
  Array.from({ length: 24 }, (_, x) => ({
    x,
    y,
    day,
    value: ((x * 3 + y * 5) % 18) + 2,
  })),
);
