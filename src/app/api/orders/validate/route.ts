import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { calculateShipping } from "@/lib/shipping";
import { validateOrderItemsForUser } from "@/lib/services/order.service";
import { orderValidationSchema } from "@/lib/validators";

export const POST = withVerifiedUser(async (request, { user }) => {
  try {
    await connectDB();
    const payload = orderValidationSchema.parse(await request.json());
    const validation = await validateOrderItemsForUser(user.id, user.email, payload);
    const shipping = await calculateShipping(validation.subtotal, user.id);
    const total = Math.max(0, validation.subtotal + shipping.fee - validation.discount);

    return apiSuccess({
      canPlaceOrder: validation.invalidItems.length === 0,
      invalidItems: validation.invalidItems,
      validItems: validation.validItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.title,
        productSlug: item.product.slug,
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        qty: item.qty,
        maxQty:
          item.product.variants?.find(
            (variant) =>
              variant._id?.toString() === item.variantId ||
              (variant.size === item.size && variant.color.name === item.color),
          )?.stock ?? 0,
        price: item.price,
        discountPrice: item.discountPrice,
        acceptedPayments: item.product.acceptedPayments,
      })),
      subtotal: validation.subtotal,
      discount: validation.discount,
      couponId: validation.couponId,
      couponMessage: validation.couponMessage,
      couponError: validation.couponError,
      shippingFee: shipping.fee,
      shippingReason: shipping.reason,
      total,
    });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to validate order");
  }
});
