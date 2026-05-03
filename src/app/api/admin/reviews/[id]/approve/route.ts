import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { approveReviewById } from "@/lib/services/review.service";

export const PUT = withSeller(async (_request, { params, user }) => {
  try {
    await connectDB();
    const review = await approveReviewById(params.id, {
      id: user.id,
      role: user.role === "admin" ? "admin" : "seller",
      name: user.name,
      email: user.email,
    });

    return apiSuccess(review, "Review approved successfully");
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to approve review");
  }
});
