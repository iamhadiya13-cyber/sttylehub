import Notification from "@/lib/models/Notification";
import { getRedisClient } from "@/lib/redis";

type NotificationInput = {
  type: string;
  title: string;
  message: string;
  link?: string;
  recipientUserId?: unknown;
  sellerId?: unknown;
  relatedId?: unknown;
  relatedModel?: string;
  applicantName?: string;
  shopName?: string;
  isRead?: boolean;
};

function normalizeNotificationPayload(notification: {
  _id: { toString(): string };
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead?: boolean;
  createdAt?: Date | string;
}) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link || "",
    createdAt:
      notification.createdAt instanceof Date
        ? notification.createdAt.toISOString()
        : String(notification.createdAt || new Date().toISOString()),
    isRead: Boolean(notification.isRead),
  };
}

async function publishNotificationRealtime(
  notification: {
    _id: { toString(): string };
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead?: boolean;
    createdAt?: Date | string;
  },
  input: NotificationInput,
) {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  const payload = JSON.stringify(normalizeNotificationPayload(notification));
  const publishTargets = new Set<string>();

  if (input.recipientUserId) {
    publishTargets.add(`notifications:user:${String(input.recipientUserId)}`);
  }

  if (!input.recipientUserId) {
    publishTargets.add("notifications:admin");
  }

  if (input.sellerId) {
    publishTargets.add(`notifications:seller:${String(input.sellerId)}`);
  }

  await Promise.all(
    [...publishTargets].map((channel) => client.publish(channel, payload)),
  );
}

export async function createNotification(input: NotificationInput) {
  const notification = await Notification.create({
    link: "/",
    isRead: false,
    ...input,
  });

  void publishNotificationRealtime(notification, input).catch((error) => {
    console.warn("[notifications] realtime publish failed", error);
  });

  return notification;
}

export async function markSellerApplicationNotificationsRead(sellerId: unknown) {
  return Notification.updateMany(
    {
      type: "new_seller_application",
      relatedId: sellerId,
    },
    { $set: { isRead: true } },
  );
}
