import { apiSuccess } from "@/lib/api";
import { CACHE_TTLS, versionedCacheKey, withCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { toObjectId } from "@/lib/route-utils";

export async function GET(request: Request, { params }: { params: { productId: string } }) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 5);

    const match = { product: toObjectId(params.productId), isApproved: true };
    const data = await withCache(
      await versionedCacheKey("reviews:product", `${params.productId}:${page}:${limit}`),
      CACHE_TTLS.publicReviews,
      async () => {
        const [reviews, total, breakdown] = await Promise.all([
          Review.find(match)
            .populate("user", "name avatar")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
          Review.countDocuments(match),
          Review.aggregate([
            { $match: match },
            { $group: { _id: "$rating", count: { $sum: 1 } } },
            { $sort: { _id: -1 } },
          ]),
        ]);

        const totalPages = Math.ceil(total / limit);
        return {
          reviews,
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          ratingBreakdown: breakdown,
        };
      },
    );

    return apiSuccess(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch reviews";
    return Response.json({ success: false, message }, { status: 500 });
  }
}
