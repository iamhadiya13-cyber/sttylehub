import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/lib/models/Coupon";
import { createAuditLog } from "@/lib/services/audit-log.service";

export const DELETE = withAdmin(async (_request, { params, user }) => {
  try {
    await connectDB();
    const coupon = await Coupon.findByIdAndDelete(params.id);
    if (!coupon) {
      return Response.json({ success: false, message: "Coupon not found" }, { status: 404 });
    }
    await createAuditLog({
      actorId: user.id,
      actorRole: "admin",
      action: "coupon_deleted",
      entityType: "Coupon",
      entityId: String(coupon._id),
      summary: `Deleted coupon ${coupon.code}`,
      metadata: { code: coupon.code },
    });
    return Response.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete coupon";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
