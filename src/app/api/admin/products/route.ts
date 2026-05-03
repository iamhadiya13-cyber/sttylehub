import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Product, Category, Seller, User, Review } from "@/lib/models";

export const GET = withAdmin(async (request) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 15);
    const stock = url.searchParams.get("stock") || "all";
    const status = url.searchParams.get("status") || "all";
    const campaign = url.searchParams.get("campaign") || "";
    const search = (url.searchParams.get("search") || "").trim();
    const query: Record<string, unknown> = {};

    if (stock === "low") {
      query.totalStock = { $gt: 0, $lte: 5 };
    } else if (stock === "out") {
      query.totalStock = 0;
    }

    if (status === "published") {
      query.isPublished = true;
    } else if (status === "draft") {
      query.isPublished = false;
    } else if (status === "featured") {
      query.isFeatured = true;
    }

    if (campaign) {
      query.campaignKey = campaign;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort({ displayPriority: -1, isFeatured: -1, createdAt: -1 })
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
    const message = error instanceof Error ? error.message : "Failed to fetch admin products";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
