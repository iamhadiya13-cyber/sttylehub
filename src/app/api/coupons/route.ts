import { apiSuccess } from "@/lib/api";

export async function GET() {
  return apiSuccess([], "Use /api/coupons/validate for coupon validation");
}
