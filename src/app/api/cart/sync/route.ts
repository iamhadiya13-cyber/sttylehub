import { apiSuccess } from "@/lib/api";
import { withVerifiedUser } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";
import { Product } from "@/lib/models/Product";
import {
  getVariantCompareAtPrice,
  getVariantSalePrice,
  isVariantActive,
  resolveVariant,
} from "@/lib/product-variants";
import { cartSyncSchema } from "@/lib/validators";

export const POST = withVerifiedUser(async (request, { user }) => {
  try {
    const payload = cartSyncSchema.parse(await request.json());
    await connectDB();

    const productIds = payload.items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds }, isPublished: true }).populate("seller", "_id");

    const productMap = new Map(products.map((product) => [product.id, product]));
    const cleanedItems = payload.items.flatMap((item) => {
      const product = productMap.get(item.productId);
      const variant = product
        ? resolveVariant(product.variants ?? [], {
            variantId: item.variantId,
            size: item.size,
            colorName: item.color,
          })
        : undefined;
      if (!product || !variant || !isVariantActive(variant) || variant.stock < item.qty) {
        return [];
      }

      const discountPrice = getVariantSalePrice(
        variant,
        product.discountPrice || product.price,
      );
      const price = getVariantCompareAtPrice(
        variant,
        product.price || discountPrice,
        discountPrice,
      );

      return [
        {
          product: product._id,
          variantId: variant._id?.toString() || item.variantId || "",
          productSlug: product.slug,
          title: product.title,
          image: variant.image || product.images[0],
          price,
          discountPrice,
          compareAtPrice: price,
          size: variant.size,
          color: variant.color.name,
          sku: variant.sku || "",
          qty: item.qty,
          seller: product.seller,
        },
      ];
    });

    const cart = await Cart.findOneAndUpdate(
      { user: user.id },
      { $set: { items: cleanedItems } },
      { upsert: true, new: true, runValidators: true },
    );

    return apiSuccess(cart.items, "Cart synced successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync cart";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
