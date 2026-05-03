import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { withAuth, withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { createOrderForUser } from "@/lib/services/order.service";
import { orderCreateSchema } from "@/lib/validators";

export const GET = withAuth(async (request, { user }) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 10);
    const status = url.searchParams.get("status");

    const query = {
      user: user.id,
      ...(status ? { orderStatus: status } : {}),
    };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("items.product", "title images")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(query),
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
    return apiErrorFromUnknown(error, "Failed to fetch orders");
  }
});

export const POST = withVerifiedUser(async (request, { user }) => {
  try {
    await connectDB();
    const payload = orderCreateSchema.parse(await request.json());
    const order = await createOrderForUser(user.id, user.email, payload);
    return apiSuccess(order, "Order created successfully");
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to create order");
  }
});
