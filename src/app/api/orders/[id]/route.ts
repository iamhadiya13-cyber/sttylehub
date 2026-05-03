import { apiSuccess } from "@/lib/api";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import "@/lib/models";
import { Order } from "@/lib/models/Order";

export const GET = withAuth(async (_request, { params, user }) => {
  try {
    await connectDB();
    const order = await Order.findById(params.id)
      .populate("user", "name email")
      .populate("coupon", "code discountType discountValue")
      .populate(
        "items.product",
        "title images price slug variants returnAllowed returnWindowDays exchangeAllowed exchangeWindowDays",
      )
      .populate("items.seller", "shopName user")
      .lean();

    if (!order) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const ownerId =
      typeof order.user === "string"
        ? order.user
        : (order.user as { _id?: { toString(): string } })?._id?.toString();
    const isOwner = ownerId === user.id;
    const isAdmin = user.role === "admin";
    const isSeller = order.items.some((item: { seller?: { _id?: { toString(): string }; user?: string | { toString(): string } } }) => {
      const sellerUserId =
        typeof item.seller?.user === "string" ? item.seller.user : item.seller?.user?.toString();
      return item.seller?._id?.toString() === user.id || sellerUserId === user.id;
    });

    if (!isOwner && !isAdmin && !isSeller) {
      return Response.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    return apiSuccess(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
