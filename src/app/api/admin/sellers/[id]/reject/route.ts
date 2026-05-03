import { apiError, apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rejectSellerApplication } from "@/lib/services/seller.service";
import { sellerRejectSchema } from "@/lib/validators";

export const PUT = withAdmin(async (
  req: Request,
  { params, user }: { params: { id: string }; user: { id: string } },
) => {
  try {
    const limited = await enforceRateLimit({
      request: req,
      prefix: "admin:seller-reject",
      identifier: user.id,
      limit: 30,
      windowMs: 60 * 60 * 1000,
      message: "Too many rejection actions. Please slow down.",
    });
    if (limited) {
      return limited;
    }

    await connectDB();
    const body = sellerRejectSchema.parse(await req.json());

    const { message } = await rejectSellerApplication(params.id, body.reason.trim(), user.id);

    return apiSuccess(undefined, message);
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to reject seller");
  }
});
