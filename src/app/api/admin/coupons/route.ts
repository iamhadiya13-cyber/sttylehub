import { z } from "zod";
import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/lib/models/Coupon";
import { getCouponAnalyticsSnapshot } from "@/lib/services/admin-analytics.service";
import { createAuditLog } from "@/lib/services/audit-log.service";

const couponSchema = z.object({
  code: z.string().min(2),
  discountType: z.enum(["percentage", "flat"]),
  discountValue: z.number().min(0),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscountAmount: z.number().min(0).default(0),
  expiryDate: z.string().optional().default(""),
  usageLimit: z.number().int().min(0).default(0),
  audienceType: z
    .enum(["all", "new_user", "second_order", "repeat_customer", "limited_users"])
    .default("all"),
  limitedUserEmails: z.array(z.string().email()).default([]),
  perUserLimit: z.number().int().min(0).default(1),
  minCompletedOrders: z.number().int().min(0).default(0),
  applicableCategories: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const GET = withAdmin(async () => {
  try {
    await connectDB();
    const [coupons, analytics] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).lean(),
      getCouponAnalyticsSnapshot(),
    ]);
    return NextResponse.json({ success: true, data: { coupons, analytics } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch coupons";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
});

export const POST = withAdmin(async (request, { user }) => {
  try {
    const payload = couponSchema.parse(await request.json());
    await connectDB();

    const coupon = await Coupon.create({
      code: payload.code.toUpperCase(),
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      minOrderAmount: payload.minOrderAmount,
      maxDiscountAmount: payload.maxDiscountAmount,
      expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : undefined,
      usageLimit: payload.usageLimit,
      audienceType: payload.audienceType,
      limitedUserEmails: payload.limitedUserEmails.map((email) => email.toLowerCase()),
      perUserLimit: payload.perUserLimit,
      minCompletedOrders: payload.minCompletedOrders,
      applicableCategories: payload.applicableCategories,
      isActive: payload.isActive,
      createdBy: user.id,
    });

    await createAuditLog({
      actorId: user.id,
      actorRole: "admin",
      action: "coupon_created",
      entityType: "Coupon",
      entityId: String(coupon._id),
      summary: `Created coupon ${coupon.code}`,
      metadata: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });

    return NextResponse.json({
      success: true,
      data: coupon,
      message: "Coupon created successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create coupon";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
});
