import { headers } from "next/headers";
import { apiSuccess } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/emails/templates";
import { Order, type OrderItemDocument } from "@/lib/models/Order";
import { User } from "@/lib/models/User";
import { getStripe } from "@/lib/stripe";
import { updateStatsFromOrder } from "@/lib/route-utils";
import { confirmOrderPayment } from "@/lib/services/order.service";

export async function POST(request: Request) {
  try {
    const signature = headers().get("stripe-signature")!;
    const rawBody = await request.text();
    const event = getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!);

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
    }

    return apiSuccess(null, "Webhook received");
  } catch {
    return apiSuccess(null, "Webhook received");
  }
}
