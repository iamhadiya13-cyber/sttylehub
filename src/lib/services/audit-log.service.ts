import mongoose from "mongoose";
import { AuditLog } from "@/lib/models/AuditLog";

type AuditLogInput = {
  actorId: string;
  actorRole?: "admin" | "seller" | "user";
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function createAuditLog(input: AuditLogInput) {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }

  try {
    return await AuditLog.create({
      actor: input.actorId,
      actorRole: input.actorRole || "admin",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      metadata: input.metadata || {},
    });
  } catch (error) {
    console.error("Audit log write failed:", error);
    return null;
  }
}

export async function listAuditLogs(page = 1, limit = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const [items, total] = await Promise.all([
    AuditLog.find({})
      .populate("actor", "name email")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    AuditLog.countDocuments({}),
  ]);

  const totalPages = Math.ceil(total / safeLimit);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}
