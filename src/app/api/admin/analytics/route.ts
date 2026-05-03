import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { CACHE_TTLS, withCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { getAdminAnalyticsSnapshot } from "@/lib/services/admin-analytics.service";

export const GET = withAdmin(async () => {
  try {
    await connectDB();
    const analytics = await withCache("admin:analytics", CACHE_TTLS.adminAnalytics, () => getAdminAnalyticsSnapshot());
    return apiSuccess(analytics);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch analytics";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
