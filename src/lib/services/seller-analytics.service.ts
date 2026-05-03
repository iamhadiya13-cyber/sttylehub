import { Types } from "mongoose";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { PayoutRequest } from "@/lib/models/PayoutRequest";
import { Seller } from "@/lib/models/Seller";
import { SellerDailyStat } from "@/lib/models/SellerDailyStat";
import { startOfMonth } from "@/lib/route-utils";

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDailySeries(
  raw: Array<{ _id: string; revenue?: number; orders?: number }>,
  days = 30,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rawMap = new Map(raw.map((item) => [item._id, item]));
  const series: Array<{ date: string; revenue: number; orders: number }> = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = toDayKey(date);
    const matched = rawMap.get(key);
    series.push({
      date: key,
      revenue: Number(matched?.revenue || 0),
      orders: Number(matched?.orders || 0),
    });
  }

  return series;
}

export async function getSellerWorkspaceSnapshot(sellerId: string) {
  const sellerObjectId = new Types.ObjectId(sellerId);
  const startMonth = startOfMonth(new Date());
  const lastMonthStart = new Date(startMonth.getFullYear(), startMonth.getMonth() - 1, 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    seller,
    thisMonthRevenueAgg,
    lastMonthRevenueAgg,
    totalOrders,
    pendingOrders,
    returnedOrders,
    cancelledOrders,
    revenueChartRaw,
    topProductsAgg,
    recentOrders,
    lowStockProducts,
    outOfStockProducts,
    listingStateCounts,
    recentPayouts,
    paidPayoutAgg,
    pendingPayoutRequestsAgg,
    topCategories,
  ] = await Promise.all([
    Seller.findById(sellerId).lean(),
    SellerDailyStat.aggregate([
      { $match: { seller: sellerObjectId, date: { $gte: startMonth } } },
      { $group: { _id: null, total: { $sum: "$revenue" } } },
    ]),
    SellerDailyStat.aggregate([
      { $match: { seller: sellerObjectId, date: { $gte: lastMonthStart, $lt: startMonth } } },
      { $group: { _id: null, total: { $sum: "$revenue" } } },
    ]),
    Order.countDocuments({ "items.seller": sellerObjectId, paymentStatus: "paid" }),
    Order.countDocuments({ "items.seller": sellerObjectId, orderStatus: { $in: ["pending", "confirmed", "processing"] } }),
    Order.countDocuments({ "items.seller": sellerObjectId, orderStatus: "returned" }),
    Order.countDocuments({ "items.seller": sellerObjectId, orderStatus: "cancelled" }),
    SellerDailyStat.aggregate([
      { $match: { seller: sellerObjectId, date: { $gte: thirtyDaysAgo } } },
      {
        $project: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          revenue: 1,
          orders: 1,
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", "items.seller": sellerObjectId } },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerObjectId } },
      {
        $group: {
          _id: "$items.product",
          unitsSold: { $sum: "$items.qty" },
          orderCount: { $sum: 1 },
          revenue: { $sum: { $multiply: ["$items.discountPrice", "$items.qty"] } },
        },
      },
      { $sort: { revenue: -1, unitsSold: -1 } },
      { $limit: 6 },
    ]),
    Order.find({ "items.seller": sellerObjectId })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("user", "name email")
      .lean(),
    Product.find({ seller: sellerObjectId, totalStock: { $gt: 0, $lte: 5 } })
      .sort({ totalStock: 1, updatedAt: -1 })
      .limit(8)
      .select("title slug images brand totalStock variants isPublished archivedAt")
      .lean(),
    Product.find({ seller: sellerObjectId, totalStock: 0 })
      .sort({ updatedAt: -1 })
      .limit(8)
      .select("title slug images brand totalStock variants isPublished archivedAt")
      .lean(),
    Product.aggregate([
      { $match: { seller: sellerObjectId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          live: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$isPublished", true] }, { $eq: ["$archivedAt", null] }] },
                1,
                0,
              ],
            },
          },
          draft: {
            $sum: {
              $cond: [{ $eq: ["$isPublished", false] }, 1, 0],
            },
          },
          archived: {
            $sum: {
              $cond: [{ $ne: ["$archivedAt", null] }, 1, 0],
            },
          },
          outOfStock: {
            $sum: {
              $cond: [{ $eq: ["$totalStock", 0] }, 1, 0],
            },
          },
        },
      },
    ]),
    PayoutRequest.find({ seller: sellerObjectId }).sort({ createdAt: -1 }).limit(8).lean(),
    PayoutRequest.aggregate([
      { $match: { seller: sellerObjectId, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    PayoutRequest.aggregate([
      { $match: { seller: sellerObjectId, status: { $in: ["pending", "approved"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: "paid", "items.seller": sellerObjectId } },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerObjectId } },
      { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $lookup: { from: "categories", localField: "product.category", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$category.name",
          revenue: { $sum: { $multiply: ["$items.discountPrice", "$items.qty"] } },
          unitsSold: { $sum: "$items.qty" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const productIds = topProductsAgg.map((entry) => entry._id).filter(Boolean);
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } })
        .select("title slug images discountPrice price totalStock isPublished archivedAt")
        .lean()
    : [];
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const topProducts = topProductsAgg.map((entry) => ({
    ...(productMap.get(String(entry._id)) || {
      _id: entry._id,
      title: "Product unavailable",
      images: [],
      discountPrice: 0,
      price: 0,
      totalStock: 0,
    }),
    unitsSold: Number(entry.unitsSold || 0),
    orderCount: Number(entry.orderCount || 0),
    revenue: Number(entry.revenue || 0),
  }));

  const thisMonthRevenue = Number(thisMonthRevenueAgg[0]?.total || 0);
  const lastMonthRevenue = Number(lastMonthRevenueAgg[0]?.total || 0);
  const revenueGrowthPercent = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : thisMonthRevenue > 0
      ? 100
      : 0;

  return {
    seller,
    thisMonthRevenue,
    lastMonthRevenue,
    revenueGrowthPercent,
    totalOrders,
    pendingOrders,
    returnedOrders,
    cancelledOrders,
    totalProducts: Number(listingStateCounts[0]?.total || 0),
    listingStates: {
      live: Number(listingStateCounts[0]?.live || 0),
      draft: Number(listingStateCounts[0]?.draft || 0),
      archived: Number(listingStateCounts[0]?.archived || 0),
      outOfStock: Number(listingStateCounts[0]?.outOfStock || 0),
    },
    totalEarnings: Number(seller?.totalEarnings || 0),
    pendingPayout: Number(seller?.pendingPayout || 0),
    paidOutTotal: Number(paidPayoutAgg[0]?.total || 0),
    requestedPayoutTotal: Number(pendingPayoutRequestsAgg[0]?.total || 0),
    revenueChart: buildDailySeries(
      revenueChartRaw as Array<{ _id: string; revenue?: number; orders?: number }>,
      30,
    ),
    topProducts,
    recentOrders,
    lowStockProducts,
    outOfStockProducts,
    recentPayouts,
    topCategories: topCategories.map((entry) => ({
      name: entry._id || "Uncategorized",
      revenue: Number(entry.revenue || 0),
      unitsSold: Number(entry.unitsSold || 0),
    })),
  };
}
