import { Types } from "mongoose";
import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { FlashSale } from "@/lib/models/FlashSale";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { getFlashSaleDiscountedPrice } from "@/lib/services/flash-sale.service";

function anonymizeName(name?: string) {
  if (!name) return "Guest";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] || "Guest";
  const lastInitial = parts[1] ? ` ${parts[1][0]?.toUpperCase()}.` : "";
  return `${first}${lastInitial}`;
}

export const GET = withAdmin(async (_request, { params }) => {
  try {
    await connectDB();
    const sale = await FlashSale.findById(params.id).lean<{
      _id: Types.ObjectId;
      name: string;
      startTime: Date;
      endTime: Date;
      discountPercent: number;
      productIds: Types.ObjectId[];
      status: "active" | "paused" | "ended";
      pausedRemainingMs?: number;
    } | null>();
    if (!sale) {
      return Response.json({ success: false, message: "Flash sale not found" }, { status: 404 });
    }

    const now = new Date();
    const saleEnd = sale.status === "active" ? new Date(Math.min(now.getTime(), sale.endTime.getTime())) : sale.endTime;
    const productIds = sale.productIds.map((id) => new Types.ObjectId(String(id)));

    const [orders, products, timelineRows, productRows, headlineRows] = await Promise.all([
      Order.find({
        createdAt: { $gte: sale.startTime, $lte: saleEnd },
        "items.product": { $in: productIds },
      })
        .sort({ createdAt: -1 })
        .limit(25)
        .populate("user", "name")
        .lean(),
      Product.find({ _id: { $in: productIds } }).lean(),
      Order.aggregate<{
        _id: { minute: number };
        orders: number;
      }>([
        { $match: { createdAt: { $gte: sale.startTime, $lte: saleEnd }, "items.product": { $in: productIds } } },
        { $group: { _id: { minute: { $dateDiff: { startDate: sale.startTime, endDate: "$createdAt", unit: "minute" } } }, orders: { $sum: 1 } } },
        { $sort: { "_id.minute": 1 } },
      ]),
      Order.aggregate<{
        _id: string;
        unitsSold: number;
        revenue: number;
      }>([
        { $match: { createdAt: { $gte: sale.startTime, $lte: saleEnd } } },
        { $unwind: "$items" },
        { $match: { "items.product": { $in: productIds } } },
        {
          $group: {
            _id: { $toString: "$items.product" },
            unitsSold: { $sum: "$items.qty" },
            revenue: { $sum: { $multiply: ["$items.discountPrice", "$items.qty"] } },
          },
        },
        { $sort: { unitsSold: -1 } },
      ]),
      Order.aggregate<{
        _id: null;
        totalOrders: number;
        totalRevenue: number;
      }>([
        { $match: { createdAt: { $gte: sale.startTime, $lte: saleEnd }, "items.product": { $in: productIds } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$total" },
          },
        },
      ]),
    ]);

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const recentOrders = orders.map((order) => ({
      _id: String(order._id),
      customer: anonymizeName((order.user as { name?: string } | undefined)?.name),
      items: order.items.map((item: { title: string }) => item.title).join(", "),
      total: order.total,
      createdAt: order.createdAt,
    }));
    const perProduct = productRows.map((row) => {
      const product = productMap.get(row._id);
      const currentStock = Number(product?.totalStock || 0);
      const originalPrice = Number(product?.discountPrice || product?.price || 0);
      return {
        productId: row._id,
        name: product?.title || "Product",
        image: product?.images?.[0] || "",
        originalPrice: Number(product?.price || originalPrice),
        salePrice: getFlashSaleDiscountedPrice(originalPrice, sale.discountPercent),
        unitsSold: row.unitsSold,
        revenue: row.revenue,
        currentStock,
        depletionRatio: row.unitsSold + currentStock > 0 ? row.unitsSold / (row.unitsSold + currentStock) : 0,
      };
    });

    const headline = headlineRows[0] || { totalOrders: 0, totalRevenue: 0 };

    return apiSuccess({
      sale: {
        _id: String(sale._id),
        name: sale.name,
        startTime: sale.startTime.toISOString(),
        endTime: sale.endTime.toISOString(),
        discountPercent: sale.discountPercent,
        status: sale.status,
        pausedRemainingMs: Number(sale.pausedRemainingMs || 0),
        productIds: sale.productIds.map((id) => String(id)),
      },
      serverNow: now.toISOString(),
      headline: {
        totalOrders: headline.totalOrders,
        totalRevenue: headline.totalRevenue,
        activeViewers: 0,
        activeProducts: sale.productIds.length,
      },
      recentOrders: recentOrders.slice(0, 20),
      perProduct,
      timeline: timelineRows.map((row) => ({
        minute: row._id.minute,
        orders: row.orders,
      })),
    });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to load flash sale stats");
  }
});
