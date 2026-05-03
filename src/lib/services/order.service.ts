import mongoose from "mongoose";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail, orderStatusEmail } from "@/lib/emails/templates";
import { bumpCacheVersion, invalidateCache } from "@/lib/cache";
import { Coupon } from "@/lib/models/Coupon";
import { CouponRedemption } from "@/lib/models/CouponRedemption";
import { Order, type OrderItemDocument } from "@/lib/models/Order";
import { Product, type ProductDocument } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { canTransition } from "@/lib/orderStatus";
import {
  getVariantCompareAtPrice,
  getVariantSalePrice,
  isVariantActive,
  resolveVariant,
} from "@/lib/product-variants";
import { applyOrderInventoryDeductions, calculateCouponDiscount } from "@/lib/route-utils";
import { createAuditLog } from "@/lib/services/audit-log.service";
import { assertCouponPerUserLimitAvailable } from "@/lib/services/coupon.service";
import { resolveFlashSalePricingForProduct } from "@/lib/services/flash-sale.service";
import { ServiceError } from "@/lib/services/service-error";
import { calculateShipping } from "@/lib/shipping";

type OrderPayload = {
  items: Array<{
    productId: string;
    variantId?: string;
    qty: number;
    size?: string;
    color?: string;
    clientPrice?: number;
    clientDiscountPrice?: number;
  }>;
  shippingAddressId?: string;
  paymentMethod: "razorpay" | "stripe" | "cod";
  couponCode?: string;
  couponId?: string;
};

type OrderServiceOptions = {
  shippingResolver?: typeof calculateShipping;
};

async function consumeCouponForOrder(
  params: {
    couponId: string;
    userId: string;
    orderId: string;
    code: string;
    discountAmount: number;
  },
  session?: mongoose.ClientSession,
) {
  const normalizedUserId = mongoose.isValidObjectId(params.userId)
    ? new mongoose.Types.ObjectId(params.userId)
    : null;
  const result = await CouponRedemption.updateOne(
    { order: params.orderId },
    {
      $setOnInsert: {
        coupon: params.couponId,
        user: params.userId,
        order: params.orderId,
        code: params.code,
        discountAmount: params.discountAmount,
      },
    },
    {
      upsert: true,
      ...(session ? { session } : {}),
    },
  );

  if (result.upsertedCount > 0) {
    if (normalizedUserId) {
      const updateExisting = await Coupon.updateOne(
        {
          _id: params.couponId,
          "usedBy.userId": normalizedUserId,
        },
        {
          $inc: {
            "usedBy.$.usageCount": 1,
          },
        },
        session ? { session } : undefined,
      );

      if (updateExisting.modifiedCount === 0) {
        await Coupon.updateOne(
          { _id: params.couponId },
          {
            $push: {
              usedBy: {
                userId: normalizedUserId,
                usageCount: 1,
              },
            },
          },
          session ? { session } : undefined,
        );
      }
    }

    const usedCountQuery = CouponRedemption.countDocuments({
      coupon: params.couponId,
    });
    const usedCount =
      session && typeof usedCountQuery === "object" && "session" in usedCountQuery
        ? await usedCountQuery.session(session)
        : await usedCountQuery;

    await Coupon.findByIdAndUpdate(
      params.couponId,
      {
        $set: { usedCount },
      },
      session ? { session } : undefined,
    );
  }
}

function buildVariantReservationKey(
  productId: string,
  variantId?: string,
  size?: string,
  color?: string,
) {
  if (variantId) {
    return `${productId}::${variantId}`;
  }
  return `${productId}::${(size || "").trim().toUpperCase()}::${(color || "").trim().toLowerCase()}`;
}

function isTransactionSupportError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.includes("replica set") ||
    message.includes("Transaction not supported")
  );
}

async function withOptionalTransaction<T>(
  work: (session?: mongoose.ClientSession) => Promise<T>,
) {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;

    try {
      await session.withTransaction(async () => {
        result = await work(session);
      });

      if (typeof result !== "undefined") {
        return result;
      }
    } catch (error) {
      if (!isTransactionSupportError(error)) {
        throw error;
      }
    }

    return await work();
  } finally {
    await session.endSession();
  }
}

export type InvalidOrderItem = {
  productId: string;
  productName: string;
  productSlug?: string;
  variantId?: string;
  size?: string;
  color?: string;
  reason:
    | "product_unavailable"
    | "product_inactive"
    | "variant_unavailable"
    | "out_of_stock"
    | "quantity_exceeds_stock"
    | "payment_method_unavailable"
    | "price_changed";
  availableStock?: number;
  currentPrice?: number;
  currentDiscountPrice?: number;
};

type ValidatedOrderItem = {
  product: ProductDocument & { _id: { toString(): string }; id: string };
  variantId?: string;
  sku?: string;
  qty: number;
  size?: string;
  color?: string;
  price: number;
  discountPrice: number;
  image?: string;
  seller: ProductDocument["seller"];
  category: ProductDocument["category"];
};

export async function validateOrderItemsForUser(
  userId: string,
  userEmail: string | null | undefined,
  payload: OrderPayload,
) {
  const productIds = [...new Set(payload.items.map((item) => item.productId))];
  const dbProducts = await Product.find({
    _id: { $in: productIds },
  });

  const productMap = new Map(dbProducts.map((product) => [product.id, product]));
  const validItems: ValidatedOrderItem[] = [];
  const invalidItems: InvalidOrderItem[] = [];
  const reservedByVariant = new Map<string, number>();

  for (const item of payload.items) {
    const product = productMap.get(item.productId);
    const productName = product?.title || "Unknown product";

    if (!product) {
      invalidItems.push({
        productId: item.productId,
        productName,
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        reason: "product_unavailable",
      });
      continue;
    }

    if (product.isPublished === false) {
      invalidItems.push({
        productId: item.productId,
        productName,
        productSlug: product.slug,
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        reason: "product_inactive",
      });
      continue;
    }

    const variant = resolveVariant(product.variants ?? [], {
      variantId: item.variantId,
      size: item.size,
      colorName: item.color,
    });

    if (!variant || !isVariantActive(variant)) {
      invalidItems.push({
        productId: item.productId,
        productName,
        productSlug: product.slug,
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        reason: "variant_unavailable",
      });
      continue;
    }

    if (variant.stock <= 0) {
      invalidItems.push({
        productId: item.productId,
        productName,
        productSlug: product.slug,
        variantId: variant._id?.toString() || item.variantId,
        size: variant.size,
        color: variant.color.name,
        reason: "out_of_stock",
        availableStock: 0,
      });
      continue;
    }

    const resolvedVariantId = variant._id?.toString() || item.variantId;
    const resolvedSize = variant.size;
    const resolvedColor = variant.color.name;
    const reservationKey = buildVariantReservationKey(
      product.id,
      resolvedVariantId,
      resolvedSize,
      resolvedColor,
    );
    const reservedQty = reservedByVariant.get(reservationKey) ?? 0;
    const availableQty = Math.max(0, variant.stock - reservedQty);

    if (availableQty < item.qty) {
      invalidItems.push({
        productId: item.productId,
        productName,
        productSlug: product.slug,
        variantId: resolvedVariantId,
        size: resolvedSize,
        color: resolvedColor,
        reason: availableQty <= 0 ? "out_of_stock" : "quantity_exceeds_stock",
        availableStock: availableQty,
      });
      continue;
    }

    if (product.acceptedPayments && product.acceptedPayments[payload.paymentMethod] === false) {
      invalidItems.push({
        productId: item.productId,
        productName,
        productSlug: product.slug,
        variantId: resolvedVariantId,
        size: resolvedSize,
        color: resolvedColor,
        reason: "payment_method_unavailable",
        availableStock: availableQty,
      });
      continue;
    }

    const flashSalePricing = await resolveFlashSalePricingForProduct(product, variant);
    const currentDiscountPrice = flashSalePricing.discountPrice;
    const currentPrice = flashSalePricing.price;

    if (
      typeof item.clientPrice === "number" &&
      typeof item.clientDiscountPrice === "number" &&
      (item.clientPrice !== currentPrice || item.clientDiscountPrice !== currentDiscountPrice)
    ) {
      invalidItems.push({
        productId: item.productId,
        productName,
        productSlug: product.slug,
        variantId: resolvedVariantId,
        size: resolvedSize,
        color: resolvedColor,
        reason: "price_changed",
        availableStock: availableQty,
        currentPrice,
        currentDiscountPrice,
      });
      continue;
    }

    validItems.push({
      product,
      variantId: resolvedVariantId,
      sku: variant.sku,
      qty: item.qty,
      size: resolvedSize,
      color: resolvedColor,
      price: currentPrice,
      discountPrice: currentDiscountPrice,
      image:
        variant.image ||
        product.colorImages?.get?.(resolvedColor)?.[0] ||
        product.images[0],
      seller: product.seller,
      category: product.category,
    });
    reservedByVariant.set(reservationKey, reservedQty + item.qty);
  }

  const subtotal = validItems.reduce((sum, item) => sum + item.discountPrice * item.qty, 0);
  const categoryIds = validItems.map((item) => item.category.toString());

  let discount = 0;
  let couponId: string | null = null;
  let couponCode: string | null = null;
  let couponMessage = "";
  let couponError = "";

  if (!invalidItems.length) {
    try {
      if (payload.couponCode) {
        const couponData = await calculateCouponDiscount({
          code: payload.couponCode,
          cartTotal: subtotal,
          categoryIds,
          userId,
          userEmail,
        });
        discount = couponData.discount;
        couponId = couponData.coupon.id;
        couponCode = couponData.coupon.code;
      } else if (payload.couponId) {
        const coupon = await Coupon.findById(payload.couponId);
        if (coupon) {
          const couponData = await calculateCouponDiscount({
            code: coupon.code,
            cartTotal: subtotal,
            categoryIds,
            userId,
            userEmail,
          });
          discount = couponData.discount;
          couponId = couponData.coupon.id;
          couponCode = couponData.coupon.code;
        }
      }
    } catch (error) {
      couponError = error instanceof Error ? error.message : "Coupon is no longer valid";
      couponMessage = couponError;
      discount = 0;
      couponId = null;
    }
  } else if (payload.couponCode || payload.couponId) {
    couponMessage = "Coupon will be recalculated after cart issues are resolved";
  }

  return {
    validItems,
    invalidItems,
    subtotal,
    discount,
    couponId,
    couponCode,
    couponMessage,
    couponError,
  };
}

export async function createOrderForUser(
  userId: string,
  userEmail: string | null | undefined,
  payload: OrderPayload,
  options?: OrderServiceOptions,
) {
  const validation = await validateOrderItemsForUser(userId, userEmail, payload);

  if (validation.invalidItems.length) {
    throw new ServiceError("Some products are unavailable", 400, {
      code: "INVALID_ORDER_ITEMS",
      details: {
        invalidItems: validation.invalidItems,
      },
    });
  }

  if ((payload.couponCode || payload.couponId) && validation.couponError) {
    throw new ServiceError(validation.couponError, 400, {
      code: "INVALID_COUPON",
    });
  }

  if (!payload.shippingAddressId) {
    throw new ServiceError("Shipping address not found", 404, {
      code: "SHIPPING_ADDRESS_REQUIRED",
    });
  }

  const userDoc = await User.findById(userId).select("name email addresses");
  const shippingAddress = userDoc?.addresses.id(payload.shippingAddressId);
  if (!shippingAddress) {
    throw new ServiceError("Shipping address not found", 404, {
      code: "SHIPPING_ADDRESS_NOT_FOUND",
    });
  }

  const items = validation.validItems.map(({ category, product, seller, ...item }) => ({
    product: product._id,
    productSlug: product.slug,
    title: product.title,
    image: item.image || product.images[0],
    seller,
    category,
    compareAtPrice: item.price,
    sku: item.sku || "",
    ...item,
  }));

  const subtotal = validation.subtotal;
  const discount = validation.discount;
  const couponId = validation.couponId;
  const couponCode = validation.couponCode || payload.couponCode?.toUpperCase().trim() || "";

  const shipping = await (options?.shippingResolver || calculateShipping)(subtotal, userId);
  const shippingCharge = shipping.fee;
  const total = Math.max(0, subtotal - discount + shippingCharge);
  const orderNumber = `SH${Date.now().toString(36).toUpperCase()}`;
  const orderPayload = {
    orderNumber,
    user: userId,
    items: items.map(({ category, ...item }) => item),
    shippingAddress,
    paymentMethod: payload.paymentMethod,
    paymentStatus: "pending",
    orderStatus: payload.paymentMethod === "cod" ? "confirmed" : "pending",
    subtotal,
    discount,
    shippingCharge,
    total,
    coupon: couponId,
    statusHistory: [
      {
        status: payload.paymentMethod === "cod" ? "confirmed" : "pending",
        timestamp: new Date(),
        note:
          payload.paymentMethod === "cod"
            ? "Order confirmed with Cash on Delivery"
            : "Order placed successfully",
        updatedBy: userId,
      },
    ],
  };

  const order = await withOptionalTransaction(async (session) => {
    if (couponId) {
      const couponDoc = await Coupon.findById(couponId).select("_id perUserLimit");
      if (!couponDoc) {
        throw new ServiceError("Coupon is no longer valid", 400, {
          code: "INVALID_COUPON",
        });
      }
      await assertCouponPerUserLimitAvailable({
        coupon: couponDoc,
        userId,
        session,
      });
    }

    const createdOrders = await Order.create([orderPayload], { session });
    const createdOrder = createdOrders[0];

    if (couponId) {
      await consumeCouponForOrder(
        {
          couponId,
          userId,
          orderId: createdOrder._id.toString(),
          code: couponCode,
          discountAmount: discount,
        },
        session,
      );
    }

    if (payload.paymentMethod === "cod") {
      await applyOrderInventoryDeductions(
        items.map((item) => ({
          product: item.product.toString(),
          variantId: item.variantId,
          size: item.size,
          color: item.color,
          qty: item.qty,
        })),
        session,
      );

    }

    return createdOrder;
  });

  if (payload.paymentMethod === "cod") {
    if (userDoc?.email) {
      try {
        await sendEmail({
          to: userDoc.email,
          subject: `Order confirmed - #${order.orderNumber}`,
          html: orderConfirmationEmail(
            {
              orderNumber: order.orderNumber,
              subtotal,
              discount,
              shippingCharge,
              total,
              shippingAddress: {
                street: shippingAddress.street,
                city: shippingAddress.city,
                state: shippingAddress.state,
                pincode: shippingAddress.pincode,
                country: shippingAddress.country,
              },
              items: order.items.map((item: OrderItemDocument) => ({
                image: item.image,
                title: item.title,
                size: item.size,
                qty: item.qty,
                price: item.discountPrice,
              })),
            },
            userDoc.name,
          ),
        });
      } catch (emailError) {
        console.error("Order confirmation email failed:", emailError);
      }
    }
  }
  await Promise.all([
    invalidateCache("admin:dashboard", "admin:analytics"),
    bumpCacheVersion("products:catalog"),
    bumpCacheVersion("products:detail"),
  ]);

  return order;
}

export async function confirmOrderPayment(
  orderId: string,
  options?: {
    paymentStatus?: "pending" | "paid" | "failed" | "refunded";
    orderStatus?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
    razorpayPaymentId?: string;
  },
) {
  const order = await withOptionalTransaction(async (session) => {
    const orderQuery = Order.findById(orderId);
    const orderDoc = session ? await orderQuery.session(session) : await orderQuery;
    if (!orderDoc) {
      throw new ServiceError("Order not found", 404, { code: "ORDER_NOT_FOUND" });
    }

    if (orderDoc.paymentStatus === "paid") {
      return orderDoc;
    }

    orderDoc.paymentStatus = options?.paymentStatus || "paid";
    orderDoc.orderStatus = options?.orderStatus || "confirmed";
    if (options?.razorpayPaymentId) {
      orderDoc.razorpayPaymentId = options.razorpayPaymentId;
    }
    await orderDoc.save(session ? { session } : undefined);

    await applyOrderInventoryDeductions(
      orderDoc.items.map((item: OrderItemDocument) => ({
        product: item.product.toString(),
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        qty: item.qty,
      })),
      session,
    );

    if (orderDoc.coupon) {
      const couponDoc = await Coupon.findById(orderDoc.coupon).select("code");
      if (couponDoc) {
        await consumeCouponForOrder(
          {
            couponId: couponDoc._id.toString(),
            userId: orderDoc.user.toString(),
            orderId: orderDoc._id.toString(),
            code: couponDoc.code,
            discountAmount: orderDoc.discount || 0,
          },
          session,
        );
      }
    }
    return orderDoc;
  });

  await Promise.all([
    invalidateCache("admin:dashboard", "admin:analytics"),
    bumpCacheVersion("products:catalog"),
    bumpCacheVersion("products:detail"),
  ]);

  return order;
}

export async function updateOrderStatusAsAdmin(
  orderId: string,
  adminUserId: string,
  payload: { status: string; trackingNumber?: string; carrier?: string },
) {
  if (payload.status === "shipped" && !payload.trackingNumber) {
    throw new ServiceError("Tracking number is required for shipped orders", 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ServiceError("Order not found", 404);
  }

  if (!canTransition(order.orderStatus, payload.status)) {
    throw new ServiceError(`Cannot change order from ${order.orderStatus} to ${payload.status}`, 400);
  }

  order.orderStatus = payload.status;
  if (payload.trackingNumber) order.trackingNumber = payload.trackingNumber;
  if (payload.carrier) order.carrier = payload.carrier;
  if (payload.status === "delivered" && !order.deliveredAt) {
    order.deliveredAt = new Date();
  }
  if (payload.status === "cancelled") {
    order.cancelledAt = new Date();
    order.cancelledBy = "admin";
  }
  order.statusHistory = [
    ...(order.statusHistory || []),
    {
      status: payload.status,
      timestamp: new Date(),
      note:
        payload.status === "shipped" && payload.trackingNumber
          ? `Shipped via ${payload.carrier || "courier"} (${payload.trackingNumber})`
          : "",
      updatedBy: adminUserId,
    },
  ];
  await order.save();
  await createAuditLog({
    actorId: adminUserId,
    actorRole: "admin",
    action: "order_status_updated",
    entityType: "Order",
    entityId: String(order._id),
    summary: `Updated order ${order.orderNumber} to ${payload.status}`,
    metadata: {
      orderNumber: order.orderNumber,
      status: payload.status,
      trackingNumber: payload.trackingNumber || "",
      carrier: payload.carrier || "",
    },
  });

  const user = await User.findById(order.user).select("email name");
  if (user?.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: `Your order is ${payload.status}`,
        html: orderStatusEmail(order, payload.status),
      });
    } catch (emailError) {
      console.error("Order status email failed:", emailError);
    }
  }
  await Promise.all([
    invalidateCache("admin:dashboard", "admin:analytics"),
    bumpCacheVersion("products:catalog"),
    bumpCacheVersion("products:detail"),
  ]);

  return order;
}
