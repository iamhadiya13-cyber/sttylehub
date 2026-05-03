import { apiSuccess } from "@/lib/api";
import { withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Review } from "@/lib/models/Review";
import { Seller } from "@/lib/models/Seller";

export const GET = withSeller(async (_request, { user }) => {
  try {
    await connectDB();

    const seller = await Seller.findOne({ user: user.id }).select("_id").lean<{ _id: string } | null>();
    if (!seller) {
      if (user.role === "admin") {
        return apiSuccess({ reviews: [] });
      }
      return Response.json({ success: false, message: "Seller profile not found" }, { status: 404 });
    }

    const products = await Product.find({ seller: seller._id }).select("_id title").lean<Array<{ _id: string; title: string }>>();
    const productMap = new Map(products.map((product) => [String(product._id), product.title]));
    const productIds = products.map((product) => product._id);

    if (!productIds.length) {
      return apiSuccess({ reviews: [] });
    }

    const reviews = await Review.find({
      product: { $in: productIds },
      isApproved: false,
    })
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .select("title comment rating createdAt user product")
      .lean<
        Array<{
          _id: string;
          title: string;
          comment: string;
          rating: number;
          createdAt?: string;
          product: string;
          user?: { name?: string };
        }>
      >();

    return apiSuccess({
      reviews: reviews.map((review) => ({
        ...review,
        product: {
          _id: String(review.product),
          title: productMap.get(String(review.product)) || "Product",
        },
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch seller reviews";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
