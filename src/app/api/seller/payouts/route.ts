import { apiSuccess } from "@/lib/api";
import { withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { PayoutRequest } from "@/lib/models/PayoutRequest";
import { Seller } from "@/lib/models/Seller";

export const GET = withSeller(async (_request, { user }) => {
  try {
    await connectDB();
    const seller = await Seller.findOne({ user: user.id }).select("_id totalEarnings pendingPayout");
    const history = seller ? await PayoutRequest.find({ seller: seller._id }).sort({ createdAt: -1 }) : [];
    return apiSuccess({
      totalEarnings: seller?.totalEarnings ?? 0,
      pendingPayout: seller?.pendingPayout ?? 0,
      history,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch payouts";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
