import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import Notification from "@/lib/models/Notification";
import { notificationUpdateSchema } from "@/lib/validators";

function resolveNotificationQuery(user: { id: string; role: string }, scope: string | null) {
  if (scope === "admin") {
    if (user.role !== "admin") {
      throw new Error("Forbidden");
    }
    return { recipientUserId: null };
  }

  return { recipientUserId: user.id };
}

export const GET = withAuth(async (request, { user }) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);
    const scope = url.searchParams.get("scope");
    const query = resolveNotificationQuery(user, scope);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, isRead: false }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({
      success: true,
      data: {
        items: notifications,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        unreadCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch notifications";
    return NextResponse.json({ success: false, message }, { status: message === "Forbidden" ? 403 : 500 });
  }
});

export const PUT = withAuth(async (request, { user }) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope");
    const query = resolveNotificationQuery(user, scope);
    const body = notificationUpdateSchema.parse(await request.json().catch(() => ({})));

    if (body.markAll) {
      await Notification.updateMany({ ...query, isRead: false }, { $set: { isRead: true } });
    } else if (body.id) {
      await Notification.findOneAndUpdate(
        { _id: body.id, ...query },
        { $set: { isRead: true } },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update notifications";
    return NextResponse.json({ success: false, message }, { status: message === "Forbidden" ? 403 : 500 });
  }
});
