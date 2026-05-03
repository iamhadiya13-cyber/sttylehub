import { z } from "zod";
import { apiSuccess } from "@/lib/api";
import { withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";

const schema = z.object({ orderId: z.string().min(1) });

export const POST = withVerifiedUser(async (request, { user }) => {
  try {
    const { orderId } = schema.parse(await request.json());
    await connectDB();
    const order = await Order.findOneAndUpdate(
      { _id: orderId, user: user.id, paymentMethod: "cod", paymentStatus: "pending" },
      { paymentStatus: "pending", orderStatus: "confirmed" },
      { new: true },
    );
    if (!order) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    return apiSuccess({ orderId: order?.id, paymentStatus: "pending" }, "Cash on delivery order confirmed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to confirm COD order";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
