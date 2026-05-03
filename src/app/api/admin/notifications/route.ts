import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-helpers";
import { connectDB } from "@/lib/db";
import Notification from "@/lib/models/Notification";

export const GET = withAdmin(async (request) => {
  try {
    await connectDB();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipientUserId: null })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipientUserId: null }),
      Notification.countDocuments({ recipientUserId: null, isRead: false }),
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
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
});

export const PUT = withAdmin(async (request) => {
  try {
    await connectDB();
    const body = (await request.json().catch(() => ({}))) as { id?: string; markAll?: boolean };
    if (body.markAll) {
      await Notification.updateMany({ recipientUserId: null, isRead: false }, { $set: { isRead: true } });
    } else if (body.id) {
      await Notification.findOneAndUpdate({ _id: body.id, recipientUserId: null }, { $set: { isRead: true } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update notifications";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
});
