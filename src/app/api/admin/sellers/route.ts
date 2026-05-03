import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Seller } from "@/lib/models/Seller";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async (req) => {
  try {
    await connectDB();
    await import("@/lib/models/User");
    await Seller.updateMany(
      { rejectedAt: null },
      { $unset: { rejectedAt: 1, rejectionReason: 1 } },
    );

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const skip = (page - 1) * limit;

    let query: Record<string, unknown> = {};
    if (status === "pending") {
      query = {
        isApproved: false,
        $or: [
          { rejectedAt: { $exists: false } },
          { rejectedAt: null },
          { rejectedAt: undefined },
        ],
      };
    } else if (status === "approved") {
      query = { isApproved: true };
    } else if (status === "rejected") {
      query = {
        isApproved: false,
        rejectedAt: { $exists: true, $ne: null },
      };
    }

    const [sellers, totalItems, pendingCount, approvedCount, rejectedCount, productCounts] = await Promise.all([
      Seller.find(query)
        .populate("user", "name email avatar createdAt")
        .populate("approvedBy", "name")
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Seller.countDocuments(query),
      Seller.countDocuments({
        isApproved: false,
        $or: [
          { rejectedAt: { $exists: false } },
          { rejectedAt: null },
        ],
      }),
      Seller.countDocuments({ isApproved: true }),
      Seller.countDocuments({
        isApproved: false,
        rejectedAt: { $exists: true, $ne: null },
      }),
      Product.aggregate([{ $group: { _id: "$seller", productCount: { $sum: 1 } } }]),
    ]);

    const productCountMap = new Map(
      productCounts.map((item) => [String(item._id), item.productCount as number]),
    );

    const enriched = sellers.map((seller) => ({
      ...seller,
      productCount: productCountMap.get(String(seller._id)) || 0,
      status: seller.isApproved ? "approved" : seller.rejectedAt ? "rejected" : "pending",
    }));

    return NextResponse.json({
      success: true,
      data: {
        sellers: enriched,
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: pendingCount + approvedCount + rejectedCount,
        },
        pagination: {
          total: totalItems,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(totalItems / limit)),
          hasNext: page < Math.ceil(totalItems / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch sellers";
    console.error("Admin sellers GET error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 },
    );
  }
});
