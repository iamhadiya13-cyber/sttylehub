import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateOrderStatusAsAdmin } from "@/lib/services/order.service";
import { adminOrderStatusSchema } from "@/lib/validators";

export const PUT = withAdmin(async (request, { params, user: adminUser }) => {
  try {
    const limited = await enforceRateLimit({
      request,
      prefix: "admin:order-status",
      identifier: adminUser.id,
      limit: 60,
      windowMs: 60 * 60 * 1000,
      message: "Too many order status updates. Please slow down.",
    });
    if (limited) {
      return limited;
    }

    const payload = adminOrderStatusSchema.parse(await request.json());

    await connectDB();
    const order = await updateOrderStatusAsAdmin(params.id, adminUser.id, payload);

    return apiSuccess(order, "Order status updated successfully");
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to update order status");
  }
});
