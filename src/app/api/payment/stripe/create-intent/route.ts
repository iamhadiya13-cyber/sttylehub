import { z } from "zod";
import { apiSuccess } from "@/lib/api";
import { withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { getStripe } from "@/lib/stripe";

const schema = z.object({ orderId: z.string().min(1) });

export const POST = withVerifiedUser(async (request, { user }) => {
  try {
    const { orderId } = schema.parse(await request.json());
    await connectDB();

    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== user.id) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const intent = await getStripe().paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: "inr",
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      },
    });

    order.stripePaymentIntentId = intent.id;
    await order.save();

    return apiSuccess({ clientSecret: intent.client_secret });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create payment intent";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
