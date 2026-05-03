import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { CACHE_TTLS, withCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { getAdminDashboardSnapshot } from "@/lib/services/admin-analytics.service";

export const GET = withAdmin(async () => {
  try {
    await connectDB();
    const dashboard = await withCache("admin:dashboard", CACHE_TTLS.adminDashboard, () => getAdminDashboardSnapshot());
    return apiSuccess(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
