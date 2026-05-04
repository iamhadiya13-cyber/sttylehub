import { type ClientSession, Types } from "mongoose";
import slugify from "slugify";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/lib/models/Coupon";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { Review } from "@/lib/models/Review";
import { DailyStat } from "@/lib/models/DailyStat";
import { SellerDailyStat } from "@/lib/models/SellerDailyStat";
import { assertCouponPerUserLimitAvailable } from "@/lib/services/coupon.service";
import {
  getTotalStock,
  isVariantActive,
  resolveVariant,
} from "@/lib/product-variants";

export function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

export function startOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function createUniqueSlug(title: string, excludeId?: string) {
  await connectDB();
  const base = slugify(title, { lower: true, strict: true, trim: true });
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await Product.findOne({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).select("_id");

    if (!existing) {
      return slug;
    }

    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function recalculateProductReviews(productId: string) {
  const [stats] = await Review.aggregate([
    {
      $match: {
        product: toObjectId(productId),
        isApproved: true,
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: stats?.averageRating ?? 0,
    totalReviews: stats?.totalReviews ?? 0,
  });
}

export async function calculateCouponDiscount({
  code,
  cartTotal,
  categoryIds,
  userId,
  userEmail,
}: {
  code: string;
  cartTotal: number;
  categoryIds: string[];
  userId?: string;
  userEmail?: string | null;
}) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    throw new Error("Invalid coupon code");
  }
  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    throw new Error("Coupon has expired");
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit reached");
  }
  if (cartTotal < coupon.minOrderAmount) {
    throw new Error("Minimum order amount not met");
  }

  if (coupon.applicableCategories.length > 0) {
    const match = coupon.applicableCategories.some((categoryId: Types.ObjectId) => categoryIds.includes(categoryId.toString()));
    if (!match) {
      throw new Error("Coupon is not applicable to these products");
    }
  }

  if (coupon.audienceType !== "all" && !userId) {
    throw new Error("Please login to use this coupon");
  }

  if (userId) {
    const [completedOrders] = await Promise.all([
      Order.countDocuments({ user: userId, orderStatus: "delivered" }),
    ]);

    if (coupon.audienceType === "new_user" && completedOrders > 0) {
      throw new Error("This coupon is only for new users");
    }
    if (coupon.audienceType === "second_order" && completedOrders !== 1) {
      throw new Error("This coupon is only valid on your second order");
    }
    if (coupon.audienceType === "repeat_customer" && completedOrders < Math.max(coupon.minCompletedOrders || 2, 2)) {
      throw new Error(`This coupon requires at least ${Math.max(coupon.minCompletedOrders || 2, 2)} completed orders`);
    }
    if (coupon.minCompletedOrders > 0 && completedOrders < coupon.minCompletedOrders) {
      throw new Error(`This coupon requires at least ${coupon.minCompletedOrders} completed orders`);
    }
    if (
      coupon.audienceType === "limited_users" &&
      coupon.limitedUserEmails.length > 0 &&
      !coupon.limitedUserEmails.includes((userEmail || "").toLowerCase())
    ) {
      throw new Error("This coupon is not assigned to your account");
    }
    await assertCouponPerUserLimitAvailable({
      coupon,
      userId,
      message: "You have already used this coupon the maximum number of times.",
    });
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount > 0) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  } else {
    discount = Math.min(coupon.discountValue, cartTotal);
  }

  return { coupon, discount };
}

export async function updateStatsFromOrder({
  sellerIds,
  total,
  itemCount,
}: {
  sellerIds: string[];
  total: number;
  itemCount: number;
}) {
  const today = startOfDay(new Date());

  await DailyStat.findOneAndUpdate(
    { date: today },
    {
      $inc: {
        revenue: total,
        orders: 1,
      },
    },
    { upsert: true, new: true },
  );

  await Promise.all(
    sellerIds.map((sellerId) =>
      SellerDailyStat.findOneAndUpdate(
        { seller: sellerId, date: today },
        {
          $inc: {
            revenue: total,
            orders: 1,
            unitsSold: itemCount,
          },
        },
        { upsert: true, new: true },
      ),
    ),
  );
}

export async function recalculateProductStock(productId: string) {
  const product = await Product.findById(productId).select("variants");
  if (!product) return null;
  const totalStock = getTotalStock(product.variants ?? []);
  await Product.findByIdAndUpdate(productId, { $set: { totalStock } });
  return totalStock;
}

export async function applyOrderInventoryDeductions(
  items: Array<{
    product: string | { toString(): string };
    variantId?: string;
    size?: string;
    color?: string;
    qty: number;
  }>,
  session?: ClientSession,
) {
  for (const item of items) {
    const productId =
      typeof item.product === "string" ? item.product : item.product.toString();

    let variantId = item.variantId;

    if (!variantId) {
      const productQuery = Product.findById(productId).select("title variants");
      const product = session ? await productQuery.session(session) : await productQuery;

      if (!product) {
        throw new Error("Product not found");
      }

      const variant = resolveVariant(product.variants ?? [], {
        variantId: item.variantId,
        size: item.size,
        colorName: item.color,
      });

      if (!variant || !isVariantActive(variant) || !variant._id) {
        throw new Error(`Variant unavailable for ${product.title}`);
      }

      variantId = variant._id.toString();
    }

    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        "variants._id": variantId,
        "variants.stock": { $gte: item.qty },
      },
      {
        $inc: {
          "variants.$.stock": -item.qty,
          totalStock: -item.qty,
          totalSold: item.qty,
        },
      },
      {
        new: true,
        ...(session ? { session } : {}),
      },
    ).select("title");

    if (!updatedProduct) {
      throw new Error(`Insufficient stock for variant ${variantId}`);
    }
  }
}
