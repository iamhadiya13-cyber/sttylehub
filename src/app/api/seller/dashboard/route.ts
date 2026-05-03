import { apiSuccess } from "@/lib/api";
import { withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Seller } from "@/lib/models/Seller";
import { getSellerWorkspaceSnapshot } from "@/lib/services/seller-analytics.service";

export const GET = withSeller(async (_request, { user }) => {
  try {
    await connectDB();
    const seller = await Seller.findOne({ user: user.id }).select("_id");
    if (!seller && user.role !== "admin") {
      return Response.json({ success: false, message: "Seller profile not found" }, { status: 404 });
    }

    const sellerId = String(seller?._id ?? user.id);
    const snapshot = await getSellerWorkspaceSnapshot(sellerId);
    return apiSuccess(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch seller dashboard";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
