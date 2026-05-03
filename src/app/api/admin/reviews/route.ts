import { apiSuccess } from "@/lib/api";
import { withAdmin, withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import "@/lib/models/Product";
import { rejectReviewById } from "@/lib/services/review.service";

export const GET = withAdmin(async (request) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending";
    const lowRating = url.searchParams.get("lowRating") === "1";
    const verified = url.searchParams.get("verified") === "1";
    const hasMedia = url.searchParams.get("hasMedia") === "1";

    const query: Record<string, unknown> =
      status === "pending"
        ? { isApproved: false }
        : status === "approved"
          ? { isApproved: true }
          : {};

    if (lowRating) {
      query.rating = { $lte: 2 };
    }

    if (verified) {
      query.isVerifiedPurchase = true;
    }

    if (hasMedia) {
      query["images.0"] = { $exists: true };
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("product", "title images");
    return apiSuccess(reviews);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch reviews";
    return Response.json({ success: false, message }, { status: 500 });
  }
});

export const DELETE = withSeller(async (request, { user }) => {
  try {
    const { reviewId } = (await request.json()) as { reviewId: string };
    await connectDB();
    await rejectReviewById(reviewId, {
      id: user.id,
      role: user.role === "admin" ? "admin" : "seller",
      name: user.name,
      email: user.email,
    });
    return apiSuccess(null, "Review deleted successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete review";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
