import { Category } from "@/lib/models/Category";
import { Order } from "@/lib/models/Order";
import { Coupon } from "@/lib/models/Coupon";
import { CouponRedemption } from "@/lib/models/CouponRedemption";
import { Product } from "@/lib/models/Product";
import { Review } from "@/lib/models/Review";
import { getStoreConfig } from "@/lib/models/StoreConfig";
import { Seller } from "@/lib/models/Seller";
import { User } from "@/lib/models/User";

void Category;

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDailySeries(
  raw: Array<{ _id: string; revenue?: number; collectedRevenue?: number; orders?: number }>,
  days = 30,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rawMap = new Map(raw.map((item) => [item._id, item]));
  const series: Array<{
    date: string;
    revenue: number;
    collectedRevenue: number;
    orders: number;
  }> = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = toDayKey(date);
    const matched = rawMap.get(key);

    series.push({
      date: key,
      revenue: Number(matched?.revenue || 0),
      collectedRevenue: Number(matched?.collectedRevenue || 0),
      orders: Number(matched?.orders || 0),
    });
  }

  return series;
}

function isValidMonthKey(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}

function normalizeSelectedMonths(selectedMonths?: string[]) {
  return [...new Set((selectedMonths || []).filter(isValidMonthKey))].sort();
}

function buildSeriesForSelectedMonths(
  raw: Array<{ _id: string; revenue?: number; collectedRevenue?: number; orders?: number }>,
  selectedMonths: string[],
) {
  const rawMap = new Map(raw.map((item) => [item._id, item]));
  const series: Array<{
    date: string;
    revenue: number;
    collectedRevenue: number;
    orders: number;
  }> = [];

  for (const monthKey of selectedMonths) {
    const [yearString, monthString] = monthKey.split("-");
    const year = Number(yearString);
    const monthIndex = Number(monthString) - 1;
    const cursor = new Date(year, monthIndex, 1);
    const limit = new Date(year, monthIndex + 1, 1);

    while (cursor < limit) {
      const key = toDayKey(cursor);
      const matched = rawMap.get(key);
      series.push({
        date: key,
        revenue: Number(matched?.revenue || 0),
        collectedRevenue: Number(matched?.collectedRevenue || 0),
        orders: Number(matched?.orders || 0),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return series;
}

export async function getAdminDashboardSnapshot(selectedMonths?: string[]) {
  const normalizedMonths = normalizeSelectedMonths(selectedMonths);
  const startDate = new Date();
  const endDate = new Date();

  if (normalizedMonths.length) {
    const [firstYear, firstMonth] = normalizedMonths[0].split("-").map(Number);
    const [lastYear, lastMonth] = normalizedMonths[normalizedMonths.length - 1].split("-").map(Number);
    startDate.setFullYear(firstYear, firstMonth - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setFullYear(lastYear, lastMonth, 1);
    endDate.setHours(0, 0, 0, 0);
  } else {
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 29);
    endDate.setHours(23, 59, 59, 999);
  }
  const storeConfig = await getStoreConfig();
  const lowStockThreshold = Number(storeConfig.lowStockThreshold || 5);

  const [
    totalOrders,
    paidOrders,
    pendingOrders,
    deliveredOrders,
    grossRevenueAgg,
    collectedRevenueAgg,
    codPendingAgg,
    revenueChartRaw,
    totalUsers,
    totalProducts,
    topProducts,
    orderStatusBreakdown,
    recentOrders,
    pendingSellerApprovals,
    pendingReviews,
    lowStockCount,
    outOfStockCount,
    lowStockProducts,
    outOfStockProducts,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: "paid" }),
    Order.countDocuments({ orderStatus: "pending" }),
    Order.countDocuments({ orderStatus: "delivered" }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      {
        $match: {
          paymentMethod: "cod",
          paymentStatus: "pending",
          orderStatus: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: normalizedMonths.length
            ? { $gte: startDate, $lt: endDate }
            : { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          revenue: {
            $sum: {
              $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$total", 0],
            },
          },
          collectedRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0],
            },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.countDocuments({ role: { $ne: "admin" } }),
    Product.countDocuments({ isPublished: true }),
    Product.find({ isPublished: true })
      .sort({ totalSold: -1 })
      .limit(10)
      .select("title images price totalSold averageRating category stock")
      .populate("category", "name"),
    Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name email"),
    Seller.countDocuments({
      isApproved: false,
      $or: [{ rejectedAt: { $exists: false } }, { rejectedAt: null }],
    }),
    Review.countDocuments({ isApproved: false }),
    Product.countDocuments({ isPublished: true, totalStock: { $gt: 0, $lte: lowStockThreshold } }),
    Product.countDocuments({ isPublished: true, totalStock: 0 }),
    Product.find({ isPublished: true, totalStock: { $gt: 0, $lte: lowStockThreshold } })
      .sort({ totalStock: 1, displayPriority: -1, createdAt: -1 })
      .limit(8)
      .select("title slug images totalStock variants brand displayPriority")
      .lean(),
    Product.find({ isPublished: true, totalStock: 0 })
      .sort({ displayPriority: -1, createdAt: -1 })
      .limit(8)
      .select("title slug images totalStock variants brand displayPriority")
      .lean(),
  ]);

  const revenueChart = normalizedMonths.length
    ? buildSeriesForSelectedMonths(
        revenueChartRaw as Array<{ _id: string; revenue?: number; collectedRevenue?: number; orders?: number }>,
        normalizedMonths,
      )
    : buildDailySeries(
        revenueChartRaw as Array<{ _id: string; revenue?: number; collectedRevenue?: number; orders?: number }>,
      );

  return {
    totalOrders,
    paidOrders,
    pendingOrders,
    deliveredOrders,
    grossRevenue: Number(grossRevenueAgg[0]?.total || 0),
    collectedRevenue: Number(collectedRevenueAgg[0]?.total || 0),
    codPendingAmount: Number(codPendingAgg[0]?.total || 0),
    totalUsers,
    totalProducts,
    revenueChart,
    ordersChart: revenueChart,
    topProducts,
    orderStatusBreakdown,
    recentOrders,
    newUsersChart: revenueChart,
    pendingSellerApprovals,
    pendingReviews,
    lowStockThreshold,
    lowStockCount,
    outOfStockCount,
    lowStockProducts,
    outOfStockProducts,
    selectedMonths: normalizedMonths,
  };
}

export async function getAdminAnalyticsSnapshot() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [monthlyRevenue, revenueByCategory, hourlyOrderHeatmap] = await Promise.all([
    Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: {
            $sum: {
              $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$total", 0],
            },
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "prod" } },
      { $unwind: "$prod" },
      { $lookup: { from: "categories", localField: "prod.category", foreignField: "_id", as: "cat" } },
      { $unwind: "$cat" },
      {
        $group: {
          _id: "$cat.name",
          revenue: { $sum: { $multiply: ["$items.discountPrice", "$items.qty"] } },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            hour: { $hour: "$createdAt" },
            day: { $dayOfWeek: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    monthlyRevenue,
    revenueByCategory,
    hourlyOrderHeatmap,
  };
}

export async function getCouponAnalyticsSnapshot() {
  const now = new Date();
  const trendStart = new Date();
  trendStart.setHours(0, 0, 0, 0);
  trendStart.setDate(trendStart.getDate() - 13);

  const [coupons, totalRedemptions, redemptionsTrendRaw, topCouponsRaw] = await Promise.all([
    Coupon.find().select("code isActive expiryDate usageLimit usedCount perUserLimit").lean(),
    CouponRedemption.countDocuments(),
    CouponRedemption.aggregate([
      { $match: { createdAt: { $gte: trendStart } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          redemptions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    CouponRedemption.aggregate([
      {
        $group: {
          _id: "$code",
          usedCount: { $sum: 1 },
          revenueLift: { $sum: "$discountAmount" },
        },
      },
      { $sort: { usedCount: -1, revenueLift: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const activeCount = coupons.filter(
    (coupon) =>
      coupon.isActive &&
      (!coupon.expiryDate || new Date(coupon.expiryDate) >= now) &&
      (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit),
  ).length;

  const expiredCount = coupons.filter(
    (coupon) => Boolean(coupon.expiryDate && new Date(coupon.expiryDate) < now),
  ).length;

  const limitReachedCount = coupons.filter(
    (coupon) => Boolean(coupon.usageLimit && coupon.usedCount >= coupon.usageLimit),
  ).length;

  const redemptionsTrend = buildDailySeries(
    (redemptionsTrendRaw as Array<{ _id: string; redemptions?: number }>).map((item) => ({
      _id: item._id,
      revenue: item.redemptions,
      collectedRevenue: 0,
      orders: 0,
    })),
    14,
  ).map((item) => ({
    date: item.date,
    redemptions: item.revenue,
  }));

  return {
    activeCount,
    expiredCount,
    limitReachedCount,
    totalRedemptions,
    topCoupons: (topCouponsRaw as Array<{ _id: string; usedCount?: number; revenueLift?: number }>).map((item) => ({
      code: item._id,
      usedCount: Number(item.usedCount || 0),
      revenueLift: Number(item.revenueLift || 0),
    })),
    redemptionsTrend,
  };
}
