import { apiSuccess } from "@/lib/api";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { orderStatusEmail } from "@/lib/emails/templates";
import { Order, type OrderItemDocument } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { Seller } from "@/lib/models/Seller";
import { User } from "@/lib/models/User";
import { findVariant, getTotalStock } from "@/lib/product-variants";
import { createNotification } from "@/lib/services/notification.service";

const CANCELLATION_REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "Delivery time too long",
  "Want to change size or color",
  "Other",
] as const;

async function cancelOrder(request: Request, { params, user }: { params: { id: string }; user: { id: string } }) {
  try {
    const body = (await request.json()) as { reason?: string; customReason?: string };
    const reason = body.reason?.trim() || "";
    const customReason = body.customReason?.trim() || "";

    if (!CANCELLATION_REASONS.includes(reason as (typeof CANCELLATION_REASONS)[number])) {
      return Response.json({ success: false, message: "Please select a cancellation reason" }, { status: 400 });
    }

    if (reason === "Other" && customReason.length < 3) {
      return Response.json({ success: false, message: "Please provide a cancellation reason" }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findById(params.id);
    if (!order || order.user.toString() !== user.id) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (order.orderStatus !== "pending") {
      return Response.json({ success: false, message: "Only pending orders can be cancelled" }, { status: 400 });
    }

    const finalReason = reason === "Other" ? customReason : reason;
    order.orderStatus = "cancelled";
    order.cancelReason = finalReason;
    order.cancelledAt = new Date();
    order.cancelledBy = "customer";
    order.statusHistory = [
      ...(order.statusHistory || []),
      {
        status: "cancelled",
        timestamp: new Date(),
        note: finalReason,
        updatedBy: user.id,
      },
    ];
    await order.save();

    await Promise.all(
      order.items.map(async (item: OrderItemDocument) => {
        const product = await Product.findById(item.product);
        if (!product) return;
        const variant = findVariant(product.variants ?? [], item.size, item.color);
        if (variant) {
          variant.stock += item.qty;
          product.totalStock = getTotalStock(product.variants ?? []);
        }
        await product.save();
      }),
    );

    const sellerProfiles = await Seller.find({ _id: { $in: [...new Set(order.items.map((item: OrderItemDocument) => String(item.seller)))] } })
      .select("_id user shopName")
      .lean<Array<{ _id: string; user: string; shopName?: string }>>();

    const itemsSummary = order.items.map((item: OrderItemDocument) => `${item.title} × ${item.qty}`).join(", ");
    await Promise.all(
      sellerProfiles.map((seller) =>
        createNotification({
          type: "order_cancelled_by_customer",
          title: "Order cancelled by customer",
          message: `Order #${order.orderNumber} was cancelled. Items: ${itemsSummary}. Reason: ${finalReason}`,
          link: `/seller/orders`,
          recipientUserId: seller.user,
          sellerId: seller._id,
          relatedId: order._id,
          relatedModel: "Order",
          applicantName: "",
          shopName: seller.shopName || "",
        }),
      ),
    );

    const customer = await User.findById(user.id).select("name email");
    if (customer?.email) {
      await sendEmail({
        to: customer.email,
        subject: "Your order is cancelled",
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
          "cancelled",
        ),
      });
    }

    return apiSuccess(order, "Your order has been cancelled.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    return Response.json({ success: false, message }, { status: 400 });
  }
}

export const PATCH = withAuth(cancelOrder);
export const PUT = withAuth(cancelOrder);
