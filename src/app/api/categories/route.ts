import { z } from "zod";
import slugify from "slugify";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { CACHE_TTLS, invalidateCache, withCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";

const schema = z.object({
  name: z.string().min(2),
  image: z.string().url().optional().default(""),
  gender: z.enum(["men", "women", "unisex", "all"]).default("all"),
  parent: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender");
    const query: Record<string, unknown> = {};
    if (gender && gender !== "all") {
      query.gender = gender;
    }
    const cacheKey = `categories:${gender || "all"}`;
    const categories = await withCache(cacheKey, CACHE_TTLS.categories, () => Category.find(query).sort({ name: 1 }).lean());
    return apiSuccess(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return Response.json({ success: false, message }, { status: 500 });
  }
}

export const POST = withAdmin(async (request) => {
  try {
    const payload = schema.parse(await request.json());
    await connectDB();
    const category = await Category.create({
      name: payload.name,
      slug: slugify(payload.name, { lower: true, strict: true }),
      image: payload.image,
      gender: payload.gender,
      parent: payload.parent || null,
      isActive: payload.isActive,
    });
    await invalidateCache("categories:all", "categories:men", "categories:women", "categories:unisex");
    return apiSuccess(category, "Category created successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
