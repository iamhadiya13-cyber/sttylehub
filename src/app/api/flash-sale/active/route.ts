import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { getCachedActiveFlashSale } from "@/lib/services/flash-sale.service";

export async function GET() {
  try {
    const sale = await getCachedActiveFlashSale();
    return apiSuccess({ sale, serverNow: new Date().toISOString() });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to load active flash sale");
  }
}
