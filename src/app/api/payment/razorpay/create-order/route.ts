import { z } from "zod";
import { apiSuccess } from "@/lib/api";
import { withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getRazorpay } from "@/lib/razorpay";

const schema = z.object({ orderId: z.string().min(1) });

export const POST = withVerifiedUser(async (request, { user }) => {
  try {
    const { orderId } = schema.parse(await request.json());
    await connectDB();

    const order = await Order.findById(orderId).populate("user", "name email");
    if (!order || order.user._id.toString() !== user.id || order.paymentStatus !== "pending") {
      return Response.json({ success: false, message: "Invalid order" }, { status: 400 });
    }

    const rzpOrder = await getRazorpay().orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order.orderNumber,
      notes: { orderId: order._id.toString() },
    });

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    return apiSuccess({
      rzpOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      customerEmail: order.user.email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Razorpay order";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
