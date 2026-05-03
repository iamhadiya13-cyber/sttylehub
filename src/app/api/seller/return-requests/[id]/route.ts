import { apiSuccess } from "@/lib/api";
import { withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { ReturnRequest, Seller } from "@/lib/models";
import { createNotification } from "@/lib/services/notification.service";
import { sellerReturnRequestDecisionSchema } from "@/lib/validators";

export const PATCH = withSeller(async (request, { params, user }) => {
  try {
    const payload = sellerReturnRequestDecisionSchema.parse(await request.json());
    await connectDB();

    const seller = await Seller.findOne({ user: user.id }).select("_id shopName");
    if (!seller) {
      return Response.json({ success: false, message: "Seller profile not found" }, { status: 404 });
    }

    const existing = await ReturnRequest.findById(params.id)
      .populate("orderId", "orderNumber")
      .populate("userId", "name email")
      .select("sellerId type status userId orderId");

    if (!existing) {
      return Response.json({ success: false, message: "Request not found" }, { status: 404 });
    }

    if (String(existing.sellerId) !== String(seller._id)) {
      return Response.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    existing.status = payload.status;
    existing.sellerNote = payload.sellerNote || "";
    await existing.save();

    await createNotification({
      type:
        payload.status === "approved"
          ? existing.type === "return"
            ? "return_request_approved"
            : "exchange_request_approved"
          : payload.status === "rejected"
            ? existing.type === "return"
              ? "return_request_rejected"
              : "exchange_request_rejected"
            : "return_request_updated",
      title:
        payload.status === "approved"
          ? `${existing.type === "return" ? "Return" : "Exchange"} request approved`
          : payload.status === "rejected"
            ? `${existing.type === "return" ? "Return" : "Exchange"} request rejected`
            : `${existing.type === "return" ? "Return" : "Exchange"} request updated`,
      message: `${seller.shopName || "Seller"} ${payload.status} the ${existing.type} request for order #${(existing.orderId as { orderNumber?: string })?.orderNumber || ""}`,
      link: `/orders/${String((existing.orderId as { _id?: string })?._id || "")}`,
      recipientUserId: (existing.userId as { _id?: string })?._id,
      relatedId: existing._id,
      relatedModel: "ReturnRequest",
      applicantName: (existing.userId as { name?: string })?.name || "Customer",
      shopName: seller.shopName || "",
    });

    return apiSuccess(existing, "Request updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update request";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
