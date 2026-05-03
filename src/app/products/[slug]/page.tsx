import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { ProductDetailScreen } from "@/components/screens";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import {
  generateBreadcrumbStructuredData,
  generateProductStructuredData,
} from "@/lib/seo/structured-data";
import { absoluteUrl, getSiteUrl, truncateSeoText } from "@/lib/seo/site";

export const revalidate = 3600;

type ProductSeoRecord = {
  title: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
  discountPrice: number;
  discountPercent?: number;
  images: string[];
  averageRating?: number;
  totalReviews?: number;
  variants?: Array<{
    size: string;
    stock: number;
    sku?: string;
    isActive?: boolean;
  }>;
};

const baseUrl = getSiteUrl();

async function getProductSeoRecord(slug: string) {
  await connectDB();
  return Product.findOne({
    slug,
    isPublished: true,
    archivedAt: null,
  })
    .select(
      "title slug brand description price discountPrice discountPercent images averageRating totalReviews variants isPublished archivedAt",
    )
    .lean<ProductSeoRecord | null>();
}

function buildProductDescription(product: ProductSeoRecord) {
  const activeVariants = (product.variants || []).filter(
    (variant) => variant.isActive !== false,
  );
  const sizes = [...new Set(activeVariants.map((variant) => variant.size).filter(Boolean))];
  const discountPercent =
    product.discountPercent && product.discountPercent > 0
      ? product.discountPercent
      : product.price > product.discountPrice
        ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
        : 0;

  return [
    `Buy ${product.title} online at StyleHub.`,
    truncateSeoText(product.description || "", 120),
    sizes.length ? `Available in sizes ${sizes.join(", ")}.` : "",
    discountPercent > 0 ? `${discountPercent}% off today.` : "",
    "Free shipping above ₹999 across India.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const product = await getProductSeoRecord(params.slug);

    if (!product) {
      return {
        title: "Product unavailable",
        description: "This product is currently unavailable on StyleHub.",
      };
    }

    const price = product.discountPrice || product.price;
    const description = buildProductDescription(product);
    const firstImage = product.images?.[0] ? absoluteUrl(product.images[0]) : absoluteUrl("/og-image.jpg");
    const title = `${product.title} by ${product.brand} — ₹${price}`;

    return {
      title,
      description,
      alternates: {
        canonical: `${baseUrl}/products/${product.slug}`,
      },
      openGraph: {
        type: "website",
        title,
        description,
        images: [
          {
            url: firstImage,
            width: 800,
            height: 800,
            alt: `${product.title} by ${product.brand}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [firstImage],
      },
    };
  } catch {
    return {
      title: "Product unavailable",
      description: "This product is currently unavailable on StyleHub.",
    };
  }
}

export async function generateStaticParams() {
  try {
    await connectDB();
    const products = await Product.find({
      isPublished: true,
      archivedAt: null,
    })
      .select("slug")
      .lean<Array<{ slug: string }>>();

    return products
      .filter((product) => Boolean(product.slug))
      .map((product) => ({ slug: product.slug }));
  } catch {
    return [];
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  let product: ProductSeoRecord | null = null;

  try {
    product = await getProductSeoRecord(params.slug);
  } catch {
    product = null;
  }

  const activeVariants = (product?.variants || []).filter(
    (variant) => variant.isActive !== false,
  );
  const firstSku = activeVariants.find((variant) => variant.sku)?.sku || "";
  const isInStock = activeVariants.some((variant) => variant.stock > 0);
  const productJsonLd = product
    ? generateProductStructuredData(
        {
          name: product.title,
          description: product.description,
          brand: product.brand,
          images: (product.images || []).map((image) => absoluteUrl(image)),
          slug: product.slug,
          sku: firstSku,
          price: product.discountPrice || product.price,
          availability: isInStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          averageRating: product.averageRating,
          reviewCount: product.totalReviews,
        },
        baseUrl,
      )
    : null;
  const breadcrumbJsonLd = product
    ? generateBreadcrumbStructuredData(
        [
          { name: "Home", href: "/" },
          { name: "Products", href: "/products" },
          { name: product.title, href: `/products/${product.slug}` },
        ],
        baseUrl,
      )
    : null;

  return (
    <>
      {productJsonLd ? <JsonLd data={productJsonLd} /> : null}
      {breadcrumbJsonLd ? <JsonLd data={breadcrumbJsonLd} /> : null}
      <ProductDetailScreen slug={params.slug} />
    </>
  );
}
