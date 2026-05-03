import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";

export const GET = withAdmin(async (request) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);
    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email"),
      Order.countDocuments(),
    ]);
    const totalPages = Math.ceil(total / limit);
    return apiSuccess({
      orders,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
