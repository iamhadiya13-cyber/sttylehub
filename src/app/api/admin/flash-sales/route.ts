import { z } from "zod";
import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { bumpCacheVersion, invalidateCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { FlashSale } from "@/lib/models/FlashSale";
import { Product } from "@/lib/models/Product";
import { getLatestFlashSaleForAdmin } from "@/lib/services/flash-sale.service";

const createFlashSaleSchema = z.object({
  name: z.string().min(2),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  discountPercent: z.number().min(1).max(90),
  productIds: z.array(z.string()).min(1),
  status: z.enum(["draft", "active", "paused", "ended"]).optional(),
});

export const GET = withAdmin(async () => {
  try {
    await connectDB();

    const [sales, activeSale] = await Promise.all([
      FlashSale.find()
        .sort({ createdAt: -1 })
        .lean(),
      getLatestFlashSaleForAdmin(),
    ]);

    const normalizedSales = sales.map((sale) => ({
      _id: String(sale._id),
      name: sale.name,
      startTime: new Date(sale.startTime).toISOString(),
      endTime: new Date(sale.endTime).toISOString(),
      discountPercent: Number(sale.discountPercent || 0),
      productIds: (sale.productIds || []).map((id: unknown) => String(id)),
      status: sale.status,
      pausedRemainingMs: Number(sale.pausedRemainingMs || 0),
      createdAt: sale.createdAt ? new Date(sale.createdAt).toISOString() : undefined,
      updatedAt: sale.updatedAt ? new Date(sale.updatedAt).toISOString() : undefined,
    }));

    return apiSuccess({
      sales: normalizedSales,
      activeSale:
        normalizedSales.find((sale) => sale.status === "active" || sale.status === "paused") ||
        activeSale,
      serverNow: new Date().toISOString(),
    });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to load flash sales");
  }
});

export const POST = withAdmin(async (request, { user }) => {
  try {
    await connectDB();
    const payload = createFlashSaleSchema.parse(await request.json());

    const [existing, productCount] = await Promise.all([
      FlashSale.findOne({ status: { $in: ["active", "paused"] } }).select("_id"),
      Product.countDocuments({ _id: { $in: payload.productIds }, isPublished: true }),
    ]);

    if (existing) {
      return Response.json(
        { success: false, message: "Finish the current flash sale before launching another one" },
        { status: 400 },
      );
    }

    if (productCount !== payload.productIds.length) {
      return Response.json(
        { success: false, message: "One or more selected products are unavailable" },
        { status: 400 },
      );
    }

    const sale = await FlashSale.create({
      name: payload.name,
      startTime: new Date(payload.startTime),
      endTime: new Date(payload.endTime),
      discountPercent: payload.discountPercent,
      productIds: payload.productIds,
      status: payload.status || "active",
      createdBy: user.id,
    });

    await Promise.all([
      invalidateCache("flash-sale:active", "homepage:content", "products:featured", "products:new-arrivals"),
      bumpCacheVersion("products:catalog"),
      bumpCacheVersion("products:detail"),
    ]);

    return apiSuccess(
      {
        _id: String(sale._id),
        name: sale.name,
        startTime: sale.startTime.toISOString(),
        endTime: sale.endTime.toISOString(),
        discountPercent: sale.discountPercent,
        productIds: sale.productIds.map((id: unknown) => String(id)),
        status: sale.status,
      },
      "Flash sale launched",
    );
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to launch flash sale");
  }
});
