import { z } from "zod";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Seller } from "@/lib/models/Seller";

const statusSchema = z.object({
  isActive: z.boolean().optional(),
  allowReapply: z.boolean().optional(),
});

export const PUT = withAdmin(async (request, { params }) => {
  try {
    const payload = statusSchema.parse(await request.json());
    await connectDB();
    const update: Record<string, unknown> = {};
    let message = "Seller updated";
    if (payload.allowReapply) {
      update.$unset = { rejectedAt: 1, rejectionReason: 1 };
      update.$set = { isApproved: false, isActive: false };
      message = "Seller can reapply now";
    }
    if (typeof payload.isActive === "boolean") {
      update.$set = { ...(update.$set as Record<string, unknown> | undefined), isActive: payload.isActive };
      message = payload.isActive ? "Seller activated" : "Seller suspended";
    }
    const seller = await Seller.findByIdAndUpdate(params.id, update, { new: true });
    if (!seller) {
      return Response.json({ success: false, message: "Seller not found" }, { status: 404 });
    }
    return apiSuccess(seller, message);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update seller status";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
