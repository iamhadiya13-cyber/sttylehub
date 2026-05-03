import mongoose from "mongoose";
import { apiSuccess } from "@/lib/api";
import { withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Order, Product, ReturnRequest } from "@/lib/models";
import { createNotification } from "@/lib/services/notification.service";
import { returnRequestSchema } from "@/lib/validators";

const DAY_MS = 24 * 60 * 60 * 1000;

type ExchangeVariant = {
  _id?: string;
  stock?: number;
  isActive?: boolean;
};

type ReturnableProduct = {
  _id?: string;
  title?: string;
  returnAllowed?: boolean;
  returnWindowDays?: number;
  exchangeAllowed?: boolean;
  exchangeWindowDays?: number;
  variants?: ExchangeVariant[];
};

type ReturnableOrderItem = {
  product?: string | ReturnableProduct | null;
  seller?: string | { _id?: string } | null;
  variantId?: string;
  title: string;
  qty: number;
  size?: string;
  color?: string;
  image: string;
};

export const POST = withVerifiedUser(async (request, { params, user }) => {
  try {
    const payload = returnRequestSchema.parse(await request.json());
    await connectDB();

    const order = await Order.findById(params.id)
      .populate("items.product", "title returnAllowed returnWindowDays exchangeAllowed exchangeWindowDays variants")
      .populate("items.seller", "shopName user")
      .select("orderNumber user orderStatus deliveredAt items");

    if (!order || order.user.toString() !== user.id) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (order.orderStatus !== "delivered" || !order.deliveredAt) {
      return Response.json({ success: false, message: "This order is not eligible yet" }, { status: 400 });
    }

    const orderItems = order.items as ReturnableOrderItem[];

    const selectedItems = orderItems.filter((item: ReturnableOrderItem) =>
      payload.items.some(
        (selected) =>
          String(item.product) === selected.productId ||
          (typeof item.product === "object" &&
            item.product !== null &&
            "_id" in item.product &&
            String(item.product._id) === selected.productId),
      ),
    );

    if (!selectedItems.length) {
      return Response.json({ success: false, message: "Select at least one item" }, { status: 400 });
    }

    const sellerIds = new Set(
      selectedItems.map((item: ReturnableOrderItem) =>
        typeof item.seller === "object" && item.seller !== null && "_id" in item.seller
          ? String(item.seller._id)
          : String(item.seller),
      ),
    );
    if (sellerIds.size !== 1) {
      return Response.json(
        { success: false, message: "Submit one request per seller." },
        { status: 400 },
      );
    }

    const deliveredAt = new Date(order.deliveredAt).getTime();
    const now = Date.now();

    for (const item of selectedItems) {
      const productDoc = item.product && typeof item.product === "object" ? item.product : null;
      if (!productDoc) {
        return Response.json({ success: false, message: "Product data unavailable" }, { status: 400 });
      }

      const allowed = payload.type === "return" ? productDoc.returnAllowed : productDoc.exchangeAllowed;
      const windowDays =
        payload.type === "return"
          ? productDoc.returnWindowDays || 7
          : productDoc.exchangeWindowDays || 7;

      if (!allowed) {
        return Response.json(
          { success: false, message: `${productDoc.title || "This product"} does not allow ${payload.type}s.` },
          { status: 400 },
        );
      }

      if (now > deliveredAt + windowDays * DAY_MS) {
        return Response.json(
          { success: false, message: `${payload.type === "return" ? "Return" : "Exchange"} window has expired.` },
          { status: 400 },
        );
      }
    }

    if (payload.type === "return" && !payload.refundMethod) {
      return Response.json({ success: false, message: "Refund details are required." }, { status: 400 });
    }

    if (payload.type === "exchange") {
      if (!payload.exchangeVariantId) {
        return Response.json({ success: false, message: "Select a replacement variant." }, { status: 400 });
      }
      const firstProduct = selectedItems[0].product && typeof selectedItems[0].product === "object" ? selectedItems[0].product : null;
      const targetVariant = firstProduct?.variants?.find(
        (variant: ExchangeVariant) => String(variant._id) === payload.exchangeVariantId,
      );
      if (!targetVariant || Number(targetVariant.stock || 0) <= 0 || targetVariant.isActive === false) {
        return Response.json({ success: false, message: "Selected replacement variant is unavailable." }, { status: 400 });
      }
    }

    const existingPending = await ReturnRequest.findOne({
      orderId: order._id,
      userId: user.id,
      type: payload.type,
      status: "pending",
    }).select("_id");

    if (existingPending) {
      return Response.json(
        { success: false, message: `A pending ${payload.type} request already exists for this order.` },
        { status: 409 },
      );
    }

    const sellerId = sellerIds.values().next().value;
    if (!sellerId) {
      return Response.json({ success: false, message: "Seller could not be resolved." }, { status: 400 });
    }
    const sellerRecipientUserId = selectedItems
      .map((item) =>
        typeof item.seller === "object" &&
        item.seller !== null &&
        "user" in item.seller
          ? String((item.seller as { user?: string }).user || "")
          : "",
      )
      .find(Boolean);
    const requestDoc = await ReturnRequest.create({
      orderId: order._id,
      userId: new mongoose.Types.ObjectId(user.id),
      sellerId: new mongoose.Types.ObjectId(sellerId),
      items: payload.items.map((item) => ({
        productId: new mongoose.Types.ObjectId(item.productId),
        variantId: item.variantId || "",
      })),
      type: payload.type,
      reason: payload.reason,
      customReason: payload.customReason || "",
      evidenceImages: payload.evidenceImages,
      refundMethod:
        payload.type === "return" && payload.refundMethod
          ? {
              type: payload.refundMethod.type,
              details: payload.refundMethod.details,
            }
          : undefined,
      exchangeVariantId: payload.exchangeVariantId || "",
      status: "pending",
    });

    await createNotification({
      type: payload.type === "return" ? "return_request_submitted" : "exchange_request_submitted",
      title: payload.type === "return" ? "New return request" : "New exchange request",
      message: `${user.name || "A customer"} submitted a ${payload.type} request for order #${order.orderNumber}`,
      link: "/seller/returns",
      recipientUserId: sellerRecipientUserId || undefined,
      sellerId,
      relatedId: requestDoc._id,
      relatedModel: "ReturnRequest",
      applicantName: user.name || user.email || "Customer",
      shopName: "",
    });

    return apiSuccess(requestDoc, `${payload.type === "return" ? "Return" : "Exchange"} request submitted successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit request";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
