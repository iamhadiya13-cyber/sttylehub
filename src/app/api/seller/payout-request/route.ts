import { apiSuccess } from "@/lib/api";
import { withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { PayoutRequest } from "@/lib/models/PayoutRequest";
import { Seller } from "@/lib/models/Seller";

export const POST = withSeller(async (_request, { user }) => {
  try {
    await connectDB();
    const seller = await Seller.findOne({ user: user.id });
    if (!seller) {
      return Response.json({ success: false, message: "Seller profile not found" }, { status: 404 });
    }
    if (seller.pendingPayout <= 0) {
      return Response.json({ success: false, message: "No payout available" }, { status: 400 });
    }

    await PayoutRequest.create({
      seller: seller._id,
      amount: seller.pendingPayout,
    });

    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "New payout request",
        html: `<p>${seller.shopName} requested a payout of ₹${seller.pendingPayout}</p>`,
      });
    }

    return apiSuccess(null, "Payout requested");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request payout";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
