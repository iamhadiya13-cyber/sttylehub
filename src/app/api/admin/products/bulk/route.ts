import { z } from "zod";
import { apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { bumpCacheVersion, invalidateCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { createAuditLog } from "@/lib/services/audit-log.service";

const bulkProductSchema = z.object({
  productIds: z.array(z.string()).min(1),
  action: z.enum([
    "publish",
    "unpublish",
    "feature",
    "unfeature",
    "set_priority",
    "assign_campaign",
    "clear_campaign",
    "archive",
    "restore",
  ]),
  campaignKey: z.string().optional().default(""),
  displayPriority: z.number().optional().default(0),
});

export const PUT = withAdmin(async (request, { user }) => {
  try {
    const body = bulkProductSchema.parse(await request.json());
    await connectDB();

    const update: Record<string, unknown> = {};

    switch (body.action) {
      case "publish":
        update.isPublished = true;
        update.archivedAt = null;
        break;
      case "unpublish":
        update.isPublished = false;
        break;
      case "feature":
        update.isFeatured = true;
        break;
      case "unfeature":
        update.isFeatured = false;
        break;
      case "assign_campaign":
        update.campaignKey = body.campaignKey || "";
        break;
      case "set_priority":
        update.displayPriority = Number(body.displayPriority || 0);
        break;
      case "clear_campaign":
        update.campaignKey = "";
        break;
      case "archive":
        update.isPublished = false;
        update.archivedAt = new Date();
        break;
      case "restore":
        update.archivedAt = null;
        break;
      default:
        break;
    }

    const result = await Product.updateMany(
      { _id: { $in: body.productIds } },
      { $set: update },
    );

    await createAuditLog({
      actorId: user.id,
      actorRole: "admin",
      action: "bulk_product_update",
      entityType: "Product",
      entityId: body.productIds.join(","),
      summary: `Applied ${body.action} to ${body.productIds.length} products`,
      metadata: {
        action: body.action,
        campaignKey: body.campaignKey || "",
        displayPriority: Number(body.displayPriority || 0),
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });

    await Promise.all([
      invalidateCache("products:featured"),
      invalidateCache("homepage:content"),
      invalidateCache("admin:dashboard"),
      bumpCacheVersion("products:catalog"),
      bumpCacheVersion("products:detail"),
    ]);

    return apiSuccess({
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update products";
    return Response.json({ success: false, message }, { status: 400 });
  }
});
