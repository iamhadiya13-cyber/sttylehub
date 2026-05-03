import { apiError, apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { approveSellerApplication } from "@/lib/services/seller.service";

export const PUT = withAdmin(async (
  _req: Request,
  { params, user }: { params: { id: string }; user: { id: string } },
) => {
  try {
    const limited = await enforceRateLimit({
      request: _req,
      prefix: "admin:seller-approve",
      identifier: user.id,
      limit: 30,
      windowMs: 60 * 60 * 1000,
      message: "Too many approval actions. Please slow down.",
    });
    if (limited) {
      return limited;
    }

    await connectDB();
    const { message } = await approveSellerApplication(params.id, user.id);
    return apiSuccess(undefined, message);
  } catch (error) {
    console.error("Approve seller error:", error);
    return apiErrorFromUnknown(error, "Failed to approve seller");
  }
});
