import { headers } from "next/headers";
import { apiSuccess } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/emails/templates";
import { Order, type OrderItemDocument } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { getStripe } from "@/lib/stripe";
import { updateStatsFromOrder } from "@/lib/route-utils";
import { createNotification } from "@/lib/services/notification.service";
import { confirmOrderPayment } from "@/lib/services/order.service";

export async function POST(request: Request) {
  const signature = headers().get("stripe-signature");
  if (!signature) {
    return Response.json({ success: false, message: "Missing stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook";
    return Response.json({ success: false, message }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      await connectDB();
      const intent = event.data.object;
      const orderId = intent.metadata.orderId;
      const existingOrder = await Order.findById(orderId);

      if (existingOrder) {
        const alreadyPaid = existingOrder.paymentStatus === "paid";
        const order = await confirmOrderPayment(orderId, {
          paymentStatus: "paid",
          orderStatus: "confirmed",
        });
        if (!order) {
          return apiSuccess(null, "Webhook received");
        }

        const sellerIds = [...new Set(order.items.map((item: OrderItemDocument) => item.seller.toString()))] as string[];
        if (!alreadyPaid) {
          await updateStatsFromOrder({
            sellerIds,
            total: order.total,
            itemCount: order.items.reduce((sum: number, item: OrderItemDocument) => sum + item.qty, 0),
          });
        }

        const customer = await User.findById(order.user).select("name email");
        if (customer?.email) {
          await sendEmail({
            to: customer.email,
            subject: `Order confirmed — #${order.orderNumber}`,
            html: orderConfirmationEmail(
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
              customer.name,
            ),
          });
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      await connectDB();
      const intent = event.data.object;
      const order = await Order.findOne({ stripePaymentIntentId: intent.id });

      if (order) {
        order.paymentStatus = "failed";
        order.orderStatus = "pending";
        order.statusHistory = [
          ...(order.statusHistory || []),
          {
            status: "pending",
            timestamp: new Date(),
            note: "Stripe payment failed. Please retry payment.",
            updatedBy: order.user,
          },
        ];
        await order.save();

        await createNotification({
          type: "payment_failed",
          title: "Payment failed",
          message: `Payment for order #${order.orderNumber} failed. Please retry your payment.`,
          link: `/orders/${order._id}`,
          recipientUserId: order.user,
          relatedId: order._id,
          relatedModel: "Order",
        });
      }
    } else {
      console.info(`[stripe webhook] unhandled event: ${event.type}`);
    }

    return apiSuccess(null, "Webhook received");
  } catch (error) {
    console.error("[stripe webhook] processing failed", error);
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return Response.json({ success: false, message }, { status: 500 });
  }
}
