import { getServerSession } from "next-auth";
import slugify from "slugify";
import { apiSuccess } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { bumpCacheVersion, CACHE_TTLS, invalidateCache, versionedCacheKey, withCache } from "@/lib/cache";
import { Category, Product, Seller, User, Review } from "@/lib/models";
import { createAuditLog } from "@/lib/services/audit-log.service";
import { applyFlashSaleToProducts, getCachedActiveFlashSale } from "@/lib/services/flash-sale.service";
import { productInputSchema } from "@/lib/validators";

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

export async function GET(request: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 12);
    const category = url.searchParams.get("category");
    const brand = url.searchParams.get("brand");
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const sizes = url.searchParams.get("sizes");
    const colors = url.searchParams.get("colors");
    const search = url.searchParams.get("search");
    const seller = url.searchParams.get("seller");
    const sort = url.searchParams.get("sort") || "newest";
    const includeDrafts = url.searchParams.get("includeDrafts") === "true";
    const gender = url.searchParams.get("gender");
    const isPublicBrowse =
      !includeDrafts ||
      !session?.user?.role ||
      !["admin", "seller"].includes(session.user.role);
    const normalizedParams = Array.from(url.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    const query: Record<string, unknown> =
      includeDrafts && session?.user?.role && ["admin", "seller"].includes(session.user.role)
        ? {}
        : { isPublished: true };

    if (gender && gender !== "all") {
      query.gender = gender;
    }

    if (category) {
      const categorySlugs = category.split(",").map((value) => value.trim()).filter(Boolean);
      const categoryDocs = await Category.find({ slug: { $in: categorySlugs } }).select("_id");
      if (!categoryDocs.length) {
        return apiSuccess({
          products: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNext: false,
          hasPrev: page > 1,
        });
      }
      query.category = { $in: categoryDocs.map((doc) => doc._id) };
    }
    if (brand) query.brand = brand;
    if (seller) query.seller = seller;
    if (sizes) query["variants.size"] = { $in: sizes.split(",").map((value) => value.trim()).filter(Boolean) };
    if (colors) query["variants.color.name"] = { $in: colors.split(",").map((value) => value.trim()).filter(Boolean) };
    if (minPrice || maxPrice) {
      query.discountPrice = {
        ...(minPrice ? { $gte: Number(minPrice) } : {}),
        ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
      };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      "price-asc": { discountPrice: 1 },
      "price-desc": { discountPrice: -1 },
      "top-rated": { averageRating: -1 },
      "best-selling": { totalSold: -1 },
    };

    const runQuery = async () => {
      const activeFlashSale = await getCachedActiveFlashSale();
      const [items, total] = await Promise.all([
        Product.find(query)
          .populate("category", "name slug")
          .populate({ path: "seller", select: "shopName user", populate: { path: "user", select: "name" } })
          .sort(sortMap[sort] ?? sortMap.newest)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Product.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);
      return {
        products: applyFlashSaleToProducts(items, activeFlashSale),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    };

    const data = isPublicBrowse
      ? await withCache(
          await versionedCacheKey("products:catalog", normalizedParams || "default"),
          CACHE_TTLS.publicProductList,
          runQuery,
        )
      : await runQuery();

    return apiSuccess(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return Response.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const currentUser = await User.findById(session.user.id).select("role isVerified");
    if (!currentUser || !["admin", "seller"].includes(currentUser.role)) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (!currentUser.isVerified) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const payload = productInputSchema.parse(await request.json());
    validateVariants(payload.variants);

    const seller = await Seller.findOne({ user: session.user.id }).select("_id");
    if (!seller) {
      return Response.json({ success: false, message: "Seller profile not found" }, { status: 404 });
    }

    let slug = slugify(payload.title, { lower: true, strict: true });
    let suffix = 2;
    while (await Product.exists({ slug })) {
      slug = `${slugify(payload.title, { lower: true, strict: true })}-${suffix}`;
      suffix += 1;
    }

    const discountPercent =
      payload.discountPrice > 0 && payload.discountPrice < payload.price
        ? Math.round(((payload.price - payload.discountPrice) / payload.price) * 100)
        : 0;

    const product = await Product.create({
      title: payload.title,
      slug,
      description: payload.description,
      shortDescription: payload.shortDescription,
      price: payload.price,
      discountPrice: payload.discountPrice,
      images: payload.images,
      colorImages: new Map(Object.entries(payload.colorImages || {})),
      category: payload.categoryId,
      brand: payload.brand,
      gender: payload.gender,
      seller: seller._id,
      variants: payload.variants,
      acceptedPayments: payload.acceptedPayments,
      returnAllowed: payload.returnAllowed,
      returnWindowDays: payload.returnWindowDays,
      exchangeAllowed: payload.exchangeAllowed,
      exchangeWindowDays: payload.exchangeWindowDays,
      isPublished: payload.isPublished,
      isFeatured: payload.isFeatured,
      tags: payload.tags,
      discountPercent,
    });

    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as "admin" | "seller",
      action: "product_created",
      entityType: "Product",
      entityId: String(product._id),
      summary: `Created product ${product.title}`,
      metadata: {
        title: product.title,
        slug: product.slug,
        sellerId: String(seller._id),
      },
    });
    await Promise.all([
      invalidateCache("products:featured", "products:new-arrivals", "homepage:content", "admin:dashboard", "admin:analytics"),
      bumpCacheVersion("products:catalog"),
      bumpCacheVersion("products:detail"),
      bumpCacheVersion("reviews:product"),
    ]);

    return apiSuccess(product, "Product created successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return Response.json({ success: false, message }, { status: 400 });
  }
}
