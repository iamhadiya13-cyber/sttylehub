import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { CACHE_TTLS, withCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { getHomepageContent } from "@/lib/services/homepage.service";

export async function GET() {
  try {
    await connectDB();
    const data = await withCache("homepage:content", CACHE_TTLS.homepageContent, () => getHomepageContent());
    return apiSuccess({ ...data, serverNow: new Date().toISOString() });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to fetch homepage content");
  }
}
