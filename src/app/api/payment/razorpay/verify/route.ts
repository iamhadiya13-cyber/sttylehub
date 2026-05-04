import crypto from "crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { newOrderNotifToSeller, orderConfirmationEmail } from "@/lib/emails/templates";
import { Order, type OrderItemDocument } from "@/lib/models/Order";
import { Seller } from "@/lib/models/Seller";
import { User } from "@/lib/models/User";
import { updateStatsFromOrder } from "@/lib/route-utils";
import { confirmOrderPayment } from "@/lib/services/order.service";

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const body = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expected !== payload.razorpay_signature) {
      return Response.json({ success: false, message: "Invalid signature" }, { status: 400 });
    }

    await connectDB();
    const existingOrder = await Order.findById(payload.orderId);
    if (!existingOrder) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (payload.razorpay_order_id !== existingOrder.razorpayOrderId) {
      return NextResponse.json(
        { success: false, error: "Order ID mismatch" },
        { status: 400 },
      );
    }

    const alreadyPaid = existingOrder.paymentStatus === "paid";
    const order = await confirmOrderPayment(payload.orderId, {
      paymentStatus: "paid",
      orderStatus: "confirmed",
      razorpayPaymentId: payload.razorpay_payment_id,
    });

    if (!order) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
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

    const sellers = await Seller.find({ _id: { $in: sellerIds } }).select("shopName user");
    await Promise.all(
      sellers.map(async (seller) => {
        const sellerUser = await User.findById(seller.user).select("email");
        if (!sellerUser?.email) return;
        const sellerItems = order.items
          .filter((item: OrderItemDocument) => item.seller.toString() === seller._id.toString())
          .map((item: OrderItemDocument) => ({ image: item.image, title: item.title, qty: item.qty, price: item.discountPrice }));

        await sendEmail({
          to: sellerUser.email,
          subject: "New order for your products!",
          html: newOrderNotifToSeller(seller.shopName, order.orderNumber, sellerItems),
        });
      }),
    );

    return apiSuccess({ orderId: order.id }, "Payment verified successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    return Response.json({ success: false, message }, { status: 400 });
  }
}
