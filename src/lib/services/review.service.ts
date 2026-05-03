import { bumpCacheVersion } from "@/lib/cache";
import { Product } from "@/lib/models/Product";
import { Review } from "@/lib/models/Review";
import { Seller } from "@/lib/models/Seller";
import { createNotification } from "@/lib/services/notification.service";
import { createAuditLog } from "@/lib/services/audit-log.service";
import { ServiceError } from "@/lib/services/service-error";

type ReviewModeratorRole = "admin" | "seller";

type ReviewModerator = {
  id: string;
  role: ReviewModeratorRole;
  name?: string | null;
  email?: string | null;
};

type ReviewModeratorInput = ReviewModerator | string | undefined;

type ReviewModerationTarget = {
  _id: string;
  title: string;
  rating: number;
  product: {
    _id: string;
    title?: string;
    seller: string;
  };
};

async function getReviewModerationTarget(reviewId: string) {
  const review = await Review.findById(reviewId)
    .populate<{ product: { _id: string; seller: string; title?: string } }>("product", "seller title")
    .select("title rating product")
    .lean<ReviewModerationTarget | null>();

  if (!review) {
    throw new ServiceError("Review not found", 404);
  }

  if (!review.product?._id || !review.product?.seller) {
    throw new ServiceError("Review product unavailable", 404);
  }

  return review;
}

export async function assertReviewModerationAccess(reviewId: string, moderator: ReviewModerator) {
  const target = await getReviewModerationTarget(reviewId);

  if (moderator.role === "admin") {
    return target;
  }

  const seller = await Seller.findOne({ user: moderator.id }).select("_id").lean<{ _id: string } | null>();
  if (!seller) {
    throw new ServiceError("Seller profile not found", 404);
  }

  if (String(target.product.seller) !== String(seller._id)) {
    throw new ServiceError("Forbidden", 403);
  }

  return target;
}

async function notifyAdminOfSellerModeration(target: ReviewModerationTarget, moderator: ReviewModerator, action: "approved" | "rejected") {
  if (moderator.role !== "seller") {
    return;
  }

  const actorLabel = moderator.name?.trim() || moderator.email?.trim() || "Seller";
  await createNotification({
    type: action === "approved" ? "seller_review_approved" : "seller_review_rejected",
    title: action === "approved" ? "Seller approved a review" : "Seller rejected a review",
    message: `${actorLabel} ${action} a review for ${target.product.title || "a product"}`,
    link: "/admin/reviews",
    relatedId: target._id,
    relatedModel: "Review",
    applicantName: actorLabel,
    shopName: target.product.title || "",
  });
}

async function refreshReviewAggregates(productId: string) {
  const approvedReviews = await Review.find({
    product: productId,
    isApproved: true,
  }).select("rating");

  const averageRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, item) => sum + item.rating, 0) / approvedReviews.length
      : 0;

  await Product.findByIdAndUpdate(productId, {
    averageRating,
    totalReviews: approvedReviews.length,
  });
}

function normalizeModerator(moderator?: ReviewModeratorInput): ReviewModerator | undefined {
  if (!moderator) {
    return undefined;
  }

  if (typeof moderator === "string") {
    return { id: moderator, role: "admin" };
  }

  return moderator;
}

export async function approveReviewById(reviewId: string, moderatorInput?: ReviewModeratorInput) {
  const moderator = normalizeModerator(moderatorInput);
  const target = moderator?.role === "seller" ? await assertReviewModerationAccess(reviewId, moderator) : null;
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ServiceError("Review not found", 404);
  }

  review.isApproved = true;
  await review.save();
  await refreshReviewAggregates(String(review.product));
  await Promise.all([
    bumpCacheVersion("products:catalog"),
    bumpCacheVersion("products:detail"),
    bumpCacheVersion("reviews:product"),
  ]);

  if (moderator) {
    await createAuditLog({
      actorId: moderator.id,
      actorRole: moderator.role,
      action: "review_approved",
      entityType: "Review",
      entityId: String(review._id),
      summary: `Approved review "${review.title}"`,
      metadata: {
        productId: String(review.product),
        rating: review.rating,
      },
    });
    if (target) {
      await notifyAdminOfSellerModeration(target, moderator, "approved");
    }
  }

  return review;
}

export async function rejectReviewById(reviewId: string, moderatorInput?: ReviewModeratorInput) {
  const moderator = normalizeModerator(moderatorInput);
  const target = moderator?.role === "seller" ? await assertReviewModerationAccess(reviewId, moderator) : null;
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ServiceError("Review not found", 404);
  }

  const productId = String(review.product);
  await review.deleteOne();
  await refreshReviewAggregates(productId);
  await Promise.all([
    bumpCacheVersion("products:catalog"),
    bumpCacheVersion("products:detail"),
    bumpCacheVersion("reviews:product"),
  ]);

  if (moderator) {
    await createAuditLog({
      actorId: moderator.id,
      actorRole: moderator.role,
      action: "review_rejected",
      entityType: "Review",
      entityId: String(review._id),
      summary: `Rejected review "${review.title}"`,
      metadata: {
        productId,
        rating: review.rating,
      },
    });
    if (target) {
      await notifyAdminOfSellerModeration(target, moderator, "rejected");
    }
  }

  return review;
}
