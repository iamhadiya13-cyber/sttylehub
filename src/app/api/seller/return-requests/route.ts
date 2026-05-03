import { apiSuccess } from "@/lib/api";
import { withSeller } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { ReturnRequest, Seller } from "@/lib/models";

type PopulatedReturnRequestItem = {
  productId:
    | string
    | {
        _id?: string;
        title?: string;
        images?: string[];
      }
    | null;
  variantId?: string;
};

export const GET = withSeller(async (_request, { user }) => {
  try {
    await connectDB();
    const seller = await Seller.findOne({ user: user.id }).select("_id");
    if (!seller) {
      return Response.json({ success: false, message: "Seller profile not found" }, { status: 404 });
    }

    const requests = await ReturnRequest.find({ sellerId: seller._id })
      .populate("orderId", "orderNumber createdAt")
      .populate("userId", "name email")
      .populate("items.productId", "title images")
      .sort({ status: 1, createdAt: -1 })
      .lean();

    const items = requests.map((request) => ({
      _id: String(request._id),
      type: request.type,
      status: request.status,
      reason: request.reason,
      customReason: request.customReason || "",
      evidenceImages: request.evidenceImages || [],
      sellerNote: request.sellerNote || "",
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      order: request.orderId,
      customer: request.userId,
      refundMethod: request.refundMethod,
      exchangeVariantId: request.exchangeVariantId || "",
      items: (request.items || []).map((item: PopulatedReturnRequestItem) => ({
        productId:
          typeof item.productId === "object" && item.productId !== null && "_id" in item.productId
            ? String(item.productId._id)
            : String(item.productId),
        variantId: item.variantId || "",
        product:
          typeof item.productId === "object" && item.productId !== null && "_id" in item.productId
            ? item.productId
            : null,
      })),
    }));

    return apiSuccess({ requests: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch return requests";
    return Response.json({ success: false, message }, { status: 500 });
  }
});
