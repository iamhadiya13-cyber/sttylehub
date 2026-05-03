import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import { getSiteUrl } from "@/lib/seo/site";

const baseUrl = getSiteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sale`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sell-on-stylehub`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    await connectDB();

    const [products, categories] = await Promise.all([
      Product.find({
        archivedAt: null,
        $or: [{ status: "active" }, { isActive: true }, { isPublished: true }],
      })
        .select("slug updatedAt")
        .lean<Array<{ slug: string; updatedAt?: Date }>>(),
      Category.find({ isActive: true })
        .select("slug updatedAt")
        .lean<Array<{ slug: string; updatedAt?: Date }>>(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products
      .filter((product) => Boolean(product.slug))
      .map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updatedAt || today,
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    const categoryRoutes: MetadataRoute.Sitemap = categories
      .filter((category) => Boolean(category.slug))
      .map((category) => ({
        url: `${baseUrl}/products?category=${category.slug}`,
        lastModified: category.updatedAt || today,
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
