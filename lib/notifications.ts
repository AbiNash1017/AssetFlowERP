import db from "@/lib/db";

/**
 * Creates a notification for a specific user.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  entityType,
  entityId,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}) {
  try {
    await db.notification.create({
      data: { userId, type, title, message, entityType, entityId },
    });
  } catch (err) {
    console.error("[createNotification] Failed:", err);
  }
}
