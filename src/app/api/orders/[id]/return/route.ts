import { apiSuccess } from "@/lib/api";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { orderStatusEmail } from "@/lib/emails/templates";
import { Order, type OrderItemDocument } from "@/lib/models/Order";
import { User } from "@/lib/models/User";

export const POST = withAuth(async (_request, { params, user }) => {
  try {
    await connectDB();
    const order = await Order.findById(params.id);
    if (!order || order.user.toString() !== user.id) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }
    if (order.orderStatus !== "delivered" || !order.deliveredAt) {
      return Response.json({ success: false, message: "Order is not eligible for return" }, { status: 400 });
    }
    const withinWindow = Date.now() - new Date(order.deliveredAt).getTime() <= 7 * 24 * 60 * 60 * 1000;
    if (!withinWindow) {
      return Response.json({ success: false, message: "Return window has closed" }, { status: 400 });
    }

    order.orderStatus = "returned";
    order.returnedAt = new Date();
    await order.save();

    const customer = await User.findById(user.id).select("email");
    if (customer?.email) {
      await sendEmail({
        to: customer.email,
        subject: "Your order is returned",
        html: orderStatusEmail(
          {
            orderNumber: order.orderNumber,
            subtotal: order.subtotal,
            discount: order.discount,
            shippingCharge: order.shippingCharge,
            total: order.total,
            shippingAddress: order.shippingAddress,
            items: order.items.map((item: OrderItemDocument) => ({
              image: item.image,
              title: item.title,
              size: item.size,
              qty: item.qty,
              price: item.discountPrice,
            })),
          },
          "returned",
        ),
      });
    }

    return apiSuccess(order, "Return request submitted successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to return order";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
