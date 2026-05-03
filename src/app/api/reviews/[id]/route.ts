import { apiSuccess } from "@/lib/api";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { recalculateProductReviews } from "@/lib/route-utils";
import { reviewUpdateSchema } from "@/lib/validators";

export const PUT = withAuth(async (request, { params, user }) => {
  try {
    const payload = reviewUpdateSchema.parse(await request.json());
    await connectDB();
    const review = await Review.findById(params.id);

    if (!review || review.user.toString() !== user.id) {
      return Response.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    review.rating = payload.rating;
    review.title = payload.title;
    review.comment = payload.comment;
    review.isApproved = false;
    await review.save();

    return apiSuccess(review, "Review updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update review";
    return Response.json({ success: false, message }, { status: 400 });
  }
});

export const DELETE = withAuth(async (_request, { params, user }) => {
  try {
    await connectDB();
    const review = await Review.findById(params.id);
    if (!review) {
      return Response.json({ success: false, message: "Review not found" }, { status: 404 });
    }
    if (review.user.toString() !== user.id && user.role !== "admin") {
      return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const productId = review.product.toString();
    await review.deleteOne();
    await recalculateProductReviews(productId);
    return apiSuccess(null, "Review deleted successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete review";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
