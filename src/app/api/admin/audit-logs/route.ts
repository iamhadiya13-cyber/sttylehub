import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { listAuditLogs } from "@/lib/services/audit-log.service";

export const GET = withAdmin(async (request) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);
    const logs = await listAuditLogs(page, limit);
    return apiSuccess(logs);
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to fetch audit logs");
  }
});
