import { apiSuccess } from "@/lib/api";
import { withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Seller } from "@/lib/models/Seller";

export const GET = withSeller(async (request, { user }) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 15);
    const status = url.searchParams.get("status") || "all";
    const stock = url.searchParams.get("stock") || "all";
    const seller = await Seller.findOne({ user: user.id }).select("_id");
    const query: Record<string, unknown> = { seller: seller?._id ?? user.id };

    if (status === "live") {
      query.isPublished = true;
      query.archivedAt = null;
    } else if (status === "draft") {
      query.isPublished = false;
    } else if (status === "archived") {
      query.archivedAt = { $ne: null };
    } else if (status === "featured") {
      query.isFeatured = true;
    }

    if (stock === "low") {
      query.totalStock = { $gt: 0, $lte: 5 };
    } else if (stock === "out") {
      query.totalStock = 0;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ displayPriority: -1, updatedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(query),
    ]);
    const totalPages = Math.ceil(total / limit);
    return apiSuccess({
      products,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch seller products";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
