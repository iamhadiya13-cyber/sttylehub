import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { CACHE_TTLS, withCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { getAdminDashboardSnapshot } from "@/lib/services/admin-analytics.service";

export const GET = withAdmin(async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const months = searchParams.getAll("months").filter(Boolean);
    const cacheKey = months.length ? `admin:dashboard:${months.sort().join(",")}` : "admin:dashboard";
    const dashboard = await withCache(cacheKey, CACHE_TTLS.adminDashboard, () => getAdminDashboardSnapshot(months));
    return apiSuccess(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
