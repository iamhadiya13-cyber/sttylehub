import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getAvailableCoupons } from "@/lib/services/coupon.service";

export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit({
      request: req,
      prefix: "coupon:available",
      limit: 30,
      windowMs: 5 * 60 * 1000,
      message: "Too many coupon requests. Please wait before refreshing.",
    });
    if (limited) {
      return limited;
    }

    const { searchParams } = new URL(req.url);
    const cartTotal = Number(searchParams.get("total") || 0);
    const categoryId = searchParams.get("categoryId");
    const includeLocked = searchParams.get("includeLocked") === "true" || searchParams.get("includeLocked") === "1";
    const eligible = await getAvailableCoupons(cartTotal, {
      categoryId,
      includeLocked,
    });
    return apiSuccess(eligible);
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to fetch available coupons");
  }
}
