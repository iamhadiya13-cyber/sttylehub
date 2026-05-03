import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { bumpCacheVersion, CACHE_TTLS, invalidateCache, versionedCacheKey, withCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { Product, Seller, User } from "@/lib/models";
import { createAuditLog } from "@/lib/services/audit-log.service";
import { applyFlashSaleToProduct, getCachedActiveFlashSale } from "@/lib/services/flash-sale.service";
import "@/lib/models/Category";
import "@/lib/models/User";
import "@/lib/models/Seller";
import "@/lib/models/Review";

function validateVariants(
  variants: Array<{
    size: string;
    color: { name: string };
    sku?: string;
  }>,
) {
  const comboKeys = new Set<string>();
  const skuKeys = new Set<string>();

  for (const variant of variants) {
    const comboKey = `${variant.color.name.trim().toLowerCase()}::${variant.size.trim().toUpperCase()}`;
    if (comboKeys.has(comboKey)) {
      throw new Error(`Duplicate variant combination: ${variant.color.name} / ${variant.size}`);
    }
    comboKeys.add(comboKey);

    if (variant.sku) {
      const skuKey = variant.sku.trim().toUpperCase();
      if (skuKeys.has(skuKey)) {
        throw new Error(`Duplicate variant SKU: ${variant.sku}`);
      }
      skuKeys.add(skuKey);
    }
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await connectDB();
    const { id } = params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const fetchProduct = async () =>
      isObjectId
        ? Product.findById(id)
            .populate("category", "name slug")
            .populate("seller", "shopName shopLogo")
            .lean()
        : Product.findOne({ slug: id, isPublished: true })
            .populate("category", "name slug")
            .populate("seller", "shopName shopLogo")
            .lean();

    const product = !isObjectId
      ? await withCache(
          await versionedCacheKey("products:detail", id),
          CACHE_TTLS.publicProductDetail,
          fetchProduct,
        )
      : await fetchProduct();

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    const activeFlashSale = await getCachedActiveFlashSale();
    return NextResponse.json({ success: true, data: applyFlashSaleToProduct(product, activeFlashSale) });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();
    const currentUser = await User.findById(session.user.id).select("role isVerified");
    if (!currentUser?.isVerified) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { id } = params;

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    if (currentUser.role !== "admin") {
      const sellerProfile = await Seller.findOne({ user: session.user.id }).select("_id");
      const sellerId = product.seller?.toString();
      if (!sellerProfile || sellerId !== sellerProfile._id.toString()) {
        return NextResponse.json(
          { success: false, message: "Forbidden" },
          { status: 403 },
        );
      }
    }

    const allowedFields = [
      "title",
      "description",
      "shortDescription",
      "price",
      "discountPrice",
      "images",
      "colorImages",
      "category",
      "brand",
      "gender",
      "sizes",
      "colors",
      "variants",
      "stock",
      "totalStock",
      "isPublished",
      "isFeatured",
      "tags",
      "acceptedPayments",
      "returnAllowed",
      "returnWindowDays",
      "exchangeAllowed",
      "exchangeWindowDays",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (body.categoryId && !body.category) {
      updates.category = body.categoryId;
    }

    const price = Number(body.price ?? product.price);
    const discountPrice = Number(body.discountPrice ?? product.discountPrice);
    if (price > 0 && discountPrice > 0) {
      updates.discountPercent = Math.round(((price - discountPrice) / price) * 100);
    }

    if (body.colorImages) {
      updates.colorImages = new Map(Object.entries(body.colorImages));
    }

    if (Array.isArray(body.variants)) {
      validateVariants(body.variants);
      updates.totalStock = body.variants.reduce(
        (sum: number, variant: { stock?: number }) => sum + (variant.stock || 0),
        0,
      );
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    ).populate("category", "name slug");

    if (updated) {
      await createAuditLog({
        actorId: session.user.id,
        actorRole: session.user.role as "admin" | "seller",
        action: "product_updated",
        entityType: "Product",
        entityId: String(updated._id),
        summary: `Updated product ${updated.title}`,
        metadata: {
          title: updated.title,
          updatedFields: Object.keys(updates),
        },
      });
      await Promise.all([
        invalidateCache("products:featured", "products:new-arrivals", "homepage:content", "admin:dashboard", "admin:analytics"),
        bumpCacheVersion("products:catalog"),
        bumpCacheVersion("products:detail"),
        bumpCacheVersion("reviews:product"),
      ]);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/products/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update product",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();
    const currentUser = await User.findById(session.user.id).select("role isVerified");
    if (!currentUser?.isVerified || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const product = await Product.findByIdAndDelete(params.id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    await createAuditLog({
      actorId: session.user.id,
      actorRole: "admin",
      action: "product_deleted",
      entityType: "Product",
      entityId: String(product._id),
      summary: `Deleted product ${product.title}`,
      metadata: {
        title: product.title,
        slug: product.slug,
      },
    });
    await Promise.all([
      invalidateCache("products:featured", "products:new-arrivals", "homepage:content", "admin:dashboard", "admin:analytics"),
      bumpCacheVersion("products:catalog"),
      bumpCacheVersion("products:detail"),
      bumpCacheVersion("reviews:product"),
    ]);

    return NextResponse.json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete product",
      },
      { status: 500 },
    );
  }
}
