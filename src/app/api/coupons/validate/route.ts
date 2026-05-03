import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateCouponForCart } from "@/lib/services/coupon.service";
import { couponValidateSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit({
      request: req,
      prefix: "coupon:validate",
      limit: 20,
      windowMs: 5 * 60 * 1000,
      message: "Too many coupon checks. Please wait before trying again.",
    });
    if (limited) {
      return limited;
    }

    const body = couponValidateSchema.parse(await req.json());
    const code = body.code.toUpperCase().trim();
    const cartTotal = Number(body.cartTotal || 0);

    const data = await validateCouponForCart({ code, cartTotal });
    return apiSuccess(data);
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to validate coupon");
  }
}
