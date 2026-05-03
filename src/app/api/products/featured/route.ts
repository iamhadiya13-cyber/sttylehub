import { apiSuccess } from "@/lib/api";
import { CACHE_TTLS, withCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { Product, Category, Seller, User, Review } from "@/lib/models";
import { applyFlashSaleToProducts, getCachedActiveFlashSale } from "@/lib/services/flash-sale.service";

export async function GET() {
  try {
    await connectDB();
    const activeFlashSale = await getCachedActiveFlashSale();
    const products = await withCache("products:featured", CACHE_TTLS.featuredProducts, async () =>
      Product.find({ isFeatured: true, isPublished: true })
        .sort({ displayPriority: -1, createdAt: -1 })
        .limit(8)
        .populate("category", "name slug")
        .lean(),
    );

    return apiSuccess(applyFlashSaleToProducts(products, activeFlashSale));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch featured products";
    return Response.json({ success: false, message }, { status: 500 });
  }
}
