import { z } from "zod";
import { apiErrorFromUnknown, apiSuccess } from "@/lib/api";
import { withAdmin } from "@/lib/api-helpers";
import { bumpCacheVersion, invalidateCache } from "@/lib/cache";
import { connectDB } from "@/lib/db";
import { FlashSale } from "@/lib/models/FlashSale";

const patchSchema = z
  .object({
    action: z.enum(["extend", "pause", "resume", "end"]).optional(),
    minutes: z.number().int().positive().optional(),
    status: z.enum(["draft", "active", "paused", "ended"]).optional(),
    endTime: z.string().datetime().optional(),
  })
  .refine((value) => value.action || value.status || value.endTime, {
    message: "No update supplied",
  });

function normalizeSale(sale: {
  _id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  discountPercent: number;
  productIds: Array<string>;
  status: "draft" | "active" | "paused" | "ended";
  pausedRemainingMs?: number;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    _id: String(sale._id),
    name: sale.name,
    startTime: sale.startTime.toISOString(),
    endTime: sale.endTime.toISOString(),
    discountPercent: sale.discountPercent,
    productIds: sale.productIds.map((id) => String(id)),
    status: sale.status,
    pausedRemainingMs: Number(sale.pausedRemainingMs || 0),
    createdAt: sale.createdAt?.toISOString(),
    updatedAt: sale.updatedAt?.toISOString(),
  };
}

export const GET = withAdmin(async (_request, { params }) => {
  try {
    await connectDB();
    const sale = await FlashSale.findById(params.id).lean();
    if (!sale) {
      return Response.json({ success: false, message: "Flash sale not found" }, { status: 404 });
    }
    return apiSuccess({ sale: normalizeSale(sale as never), serverNow: new Date().toISOString() });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to load flash sale");
  }
});

export const PATCH = withAdmin(async (request, { params }) => {
  try {
    await connectDB();
    const payload = patchSchema.parse(await request.json());
    const sale = await FlashSale.findById(params.id);
    if (!sale) {
      return Response.json({ success: false, message: "Flash sale not found" }, { status: 404 });
    }

    const now = new Date();

    if (payload.endTime) {
      sale.endTime = new Date(payload.endTime);
    }

    if (payload.status) {
      sale.status = payload.status;
      if (payload.status !== "paused") {
        sale.pausedRemainingMs = 0;
      }
    }

    if (payload.action === "extend") {
      sale.endTime = new Date(sale.endTime.getTime() + (payload.minutes || 30) * 60_000);
      if (sale.status === "ended") {
        sale.status = "active";
      }
    }

    if (payload.action === "pause" && sale.status === "active") {
      sale.pausedRemainingMs = Math.max(0, sale.endTime.getTime() - now.getTime());
      sale.endTime = now;
      sale.status = "paused";
    }

    if (payload.action === "resume" && sale.status === "paused") {
      sale.endTime = new Date(now.getTime() + Math.max(0, sale.pausedRemainingMs || 0));
      sale.pausedRemainingMs = 0;
      sale.status = "active";
    }

    if (payload.action === "end") {
      sale.endTime = now;
      sale.pausedRemainingMs = 0;
      sale.status = "ended";
    }

    await sale.save();
    await Promise.all([
      invalidateCache("flash-sale:active", "homepage:content", "products:featured", "products:new-arrivals"),
      bumpCacheVersion("products:catalog"),
      bumpCacheVersion("products:detail"),
    ]);

    return apiSuccess({ sale: normalizeSale(sale.toObject() as never) }, "Flash sale updated");
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to update flash sale");
  }
});

export const DELETE = withAdmin(async (_request, { params }) => {
  try {
    await connectDB();
    await FlashSale.findByIdAndDelete(params.id);
    await Promise.all([
      invalidateCache("flash-sale:active", "homepage:content", "products:featured", "products:new-arrivals"),
      bumpCacheVersion("products:catalog"),
      bumpCacheVersion("products:detail"),
    ]);
    return apiSuccess({ ok: true }, "Flash sale deleted");
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to delete flash sale");
  }
});
