import { apiSuccess } from "@/lib/api";
import { withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Notification } from "@/lib/models/Notification";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { Review } from "@/lib/models/Review";
import { User } from "@/lib/models/User";
import { enforceRateLimit } from "@/lib/rate-limit";
import { reviewCreateSchema } from "@/lib/validators";

export const POST = withVerifiedUser(async (request, { user }) => {
  try {
    const limited = await enforceRateLimit({
      request,
      prefix: "review:create",
      identifier: user.id,
      limit: 10,
      windowMs: 60 * 60 * 1000,
      message: "Too many review submissions. Please wait before trying again.",
    });
    if (limited) {
      return limited;
    }

    const payload = reviewCreateSchema.parse(await request.json());
    await connectDB();

    const deliveredOrder = await Order.findOne({
      user: user.id,
      orderStatus: "delivered",
      "items.product": payload.productId,
    }).select("_id");

    if (!deliveredOrder) {
      return Response.json({ success: false, message: "Only delivered orders can be reviewed" }, { status: 403 });
    }

    const existingReview = await Review.findOne({ user: user.id, product: payload.productId }).select("_id");
    if (existingReview) {
      return Response.json({ success: false, message: "You have already reviewed this product" }, { status: 409 });
    }

    const review = await Review.create({
      user: user.id,
      product: payload.productId,
      rating: payload.rating,
      title: payload.title,
      comment: payload.comment,
      images: payload.images,
      isVerifiedPurchase: true,
    });

    const [author, product] = await Promise.all([
      User.findById(user.id).select("name"),
      Product.findById(payload.productId).select("title"),
    ]);

    await Notification.create({
      type: "new_review",
      title: "New Product Review",
      message: `${author?.name || "A customer"} reviewed ${product?.title || "a product"}`,
      link: "/admin/reviews",
      relatedId: review._id,
      relatedModel: "Review",
    });

    return apiSuccess(null, "Review pending approval");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
