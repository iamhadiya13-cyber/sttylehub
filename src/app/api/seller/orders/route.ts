import { z } from "zod";
import { apiSuccess } from "@/lib/api";
import { withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Seller } from "@/lib/models/Seller";

const updateSchema = z.object({
  orderId: z.string().min(1),
  trackingNumber: z.string().min(3),
});

export const GET = withSeller(async (request, { user }) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 15);
    const status = url.searchParams.get("status") || "all";
    const seller = await Seller.findOne({ user: user.id }).select("_id");
    const query: Record<string, unknown> = { "items.seller": seller?._id ?? user.id };

    if (status !== "all") {
      query.orderStatus = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "name email"),
      Order.countDocuments(query),
    ]);
    const totalPages = Math.ceil(total / limit);
    return apiSuccess({
      orders,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch seller orders";
    return Response.json({ success: false, message }, { status: 500 });
  }
});

export const PUT = withSeller(async (request, { user }) => {
  try {
    const payload = updateSchema.parse(await request.json());
    await connectDB();
    const seller = await Seller.findOne({ user: user.id }).select("_id");
    const order = await Order.findOne({
      _id: payload.orderId,
      "items.seller": seller?._id ?? user.id,
    });
    if (!order) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    order.orderStatus = "shipped";
    order.trackingNumber = payload.trackingNumber;
    await order.save();

    return apiSuccess(order, "Shipment updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update shipment";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
