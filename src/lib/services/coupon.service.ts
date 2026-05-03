import { getServerSession } from "next-auth";
import { Types, type ClientSession } from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/lib/models/Coupon";
import { CouponRedemption } from "@/lib/models/CouponRedemption";
import { Order } from "@/lib/models/Order";
import { ServiceError } from "@/lib/services/service-error";

export type CouponSession = {
  user?: {
    id?: string | null;
    email?: string | null;
  };
} | null;

export function resolveCouponPerUserLimit(perUserLimit?: number | null) {
  return perUserLimit === 0 ? 0 : perUserLimit || 1;
}

export async function getCouponUsageCountForUser(
  couponId: string,
  userId: string,
  session?: ClientSession,
) {
  const orderQuery = Order.countDocuments({
    user: userId,
    coupon: couponId,
    orderStatus: { $ne: "cancelled" },
  });
  const redemptionQuery = CouponRedemption.countDocuments({
    user: userId,
    coupon: couponId,
  });

  const [orderCount, redemptionCount] = await Promise.all([
    session ? orderQuery.session(session) : orderQuery,
    session ? redemptionQuery.session(session) : redemptionQuery,
  ]);

  return Math.max(orderCount, redemptionCount);
}

export async function assertCouponPerUserLimitAvailable(params: {
  coupon: {
    _id: { toString(): string } | string;
    perUserLimit?: number | null;
  };
  userId?: string | null;
  session?: ClientSession;
  message?: string;
}) {
  const { coupon, userId, session } = params;
  const perUserLimit = resolveCouponPerUserLimit(coupon.perUserLimit);

  if (!userId || perUserLimit === 0) {
    return;
  }

  const usageCount = await getCouponUsageCountForUser(
    typeof coupon._id === "string" ? coupon._id : coupon._id.toString(),
    userId,
    session,
  );

  if (usageCount >= perUserLimit) {
    throw new ServiceError(
      params.message || "You have already used this coupon the maximum number of times.",
      400,
    );
  }
}

export function calculateCouponDiscountValue(
  coupon: {
    discountType: "percentage" | "flat";
    discountValue: number;
    maxDiscountAmount?: number;
  },
  cartTotal: number,
) {
  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = Math.round((cartTotal * coupon.discountValue) / 100);
    if ((coupon.maxDiscountAmount || 0) > 0) {
      discount = Math.min(discount, coupon.maxDiscountAmount || 0);
    }
  } else {
    discount = Math.min(coupon.discountValue, cartTotal);
  }
  return discount;
}

export async function getAvailableCouponsForContext(
  cartTotal: number,
  session: CouponSession,
  options?: {
    categoryId?: string | null;
    includeLocked?: boolean;
  },
) {
  const now = new Date();
  const categoryId = options?.categoryId?.trim() || null;
  const includeLocked = options?.includeLocked === true;

  const coupons = await Coupon.find({
    isActive: true,
    $and: [
      {
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gt: now } },
        ],
      },
      {
        $or: [
          { usageLimit: 0 },
          { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
        ],
      },
    ],
  })
    .select("code discountType discountValue minOrderAmount maxDiscountAmount audienceType expiryDate applicableCategories perUserLimit")
    .limit(10)
    .lean();

  let usageByCoupon = new Map<string, number>();
  if (session?.user?.id && coupons.length) {
    const usage = await Order.aggregate<{
      _id: unknown;
      count: number;
    }>([
      {
        $match: {
          user: new Types.ObjectId(session.user.id),
          coupon: { $in: coupons.map((coupon) => coupon._id) },
          orderStatus: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$coupon",
          count: { $sum: 1 },
        },
      },
    ]);

    usageByCoupon = new Map(
      usage.map((entry) => [String(entry._id), entry.count]),
    );
  }

  return coupons.filter((coupon) => {
    if (
      categoryId &&
      coupon.applicableCategories?.length &&
      !coupon.applicableCategories.some((entry: unknown) => String(entry) === categoryId)
    ) {
      return false;
    }

    if (!includeLocked && (coupon.minOrderAmount || 0) > 0 && cartTotal < (coupon.minOrderAmount || 0)) {
      return false;
    }
    if (!session && coupon.audienceType !== "all") {
      return false;
    }

    if (session?.user?.id) {
      const perUserLimit = resolveCouponPerUserLimit(coupon.perUserLimit);
      if (perUserLimit !== 0 && (usageByCoupon.get(String(coupon._id)) || 0) >= perUserLimit) {
        return false;
      }
    }

    return true;
  }).map(({ applicableCategories: _applicableCategories, _id: _couponId, ...coupon }) => coupon);
}

export async function validateCouponForContext({
  code,
  cartTotal,
  session,
}: {
  code: string;
  cartTotal: number;
  session: CouponSession;
}) {
  const coupon = await Coupon.findOne({
    code: code.toUpperCase().trim(),
    isActive: true,
  });

  if (!coupon) {
    throw new ServiceError("Invalid coupon code", 400);
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    throw new ServiceError("Coupon has expired", 400);
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new ServiceError("Coupon usage limit reached", 400);
  }

  if (coupon.minOrderAmount > 0 && cartTotal < coupon.minOrderAmount) {
    throw new ServiceError(`Minimum order Rs.${coupon.minOrderAmount} required`, 400);
  }

  if (coupon.audienceType !== "all" && !session?.user?.id) {
    throw new ServiceError("Please login to use this coupon", 401);
  }

  if (session?.user?.id) {
    const userId = session.user.id;
    const [orderCount] = await Promise.all([
      Order.countDocuments({
        user: userId,
        orderStatus: "delivered",
      }),
    ]);

    if (coupon.audienceType === "new_user" && orderCount > 0) {
      throw new ServiceError("This coupon is for new users only", 400);
    }

    if (coupon.audienceType === "second_order" && orderCount !== 1) {
      throw new ServiceError("This coupon is for your 2nd order", 400);
    }

    if (
      coupon.audienceType === "repeat_customer" &&
      orderCount < (coupon.minCompletedOrders || 2)
    ) {
      throw new ServiceError(`Need ${coupon.minCompletedOrders || 2}+ completed orders`, 400);
    }

    if (coupon.audienceType === "limited_users" && coupon.limitedUserEmails?.length > 0) {
      const userEmail = session.user.email?.toLowerCase() || "";
      if (!coupon.limitedUserEmails.includes(userEmail)) {
        throw new ServiceError("You are not eligible for this coupon", 400);
      }
    }

    await assertCouponPerUserLimitAvailable({
      coupon,
      userId,
    });
  }

  const discount = calculateCouponDiscountValue(coupon, cartTotal);

  return {
    couponId: coupon._id.toString(),
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discount,
    message: `Rs.${discount} discount applied!`,
  };
}

export async function getAvailableCoupons(
  cartTotal: number,
  options?: {
    categoryId?: string | null;
    includeLocked?: boolean;
  },
) {
  await connectDB();
  const session = await getServerSession(authOptions);
  return getAvailableCouponsForContext(cartTotal, session, options);
}

export async function validateCouponForCart({
  code,
  cartTotal,
}: {
  code: string;
  cartTotal: number;
}) {
  await connectDB();
  const session = await getServerSession(authOptions);
  return validateCouponForContext({ code, cartTotal, session });
}
