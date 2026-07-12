import db from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Logs an auditable action to the ActivityLog table.
 */
export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("[logActivity] Failed:", err);
  }
}
