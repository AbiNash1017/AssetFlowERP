import { NextResponse } from "next/server";
import db from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: Request) {
  // Optional security: check for authorization headers or CRON_SECRET key
  // For hackathon simplicity, we allow invoking the GET route.
  
  try {
    const now = new Date();

    // 1. Fetch active allocations that are past due date
    const overdueAllocations = await db.allocation.findMany({
      where: {
        status: "ACTIVE",
        expectedReturnDate: {
          lt: now,
        },
      },
      include: {
        asset: true,
        user: true,
      },
    });

    if (overdueAllocations.length === 0) {
      return NextResponse.json({ message: "No overdue allocations found.", count: 0 });
    }

    // 2. Fetch active managers/admins to receive alerts
    const managers = await db.user.findMany({
      where: {
        role: { in: ["ASSET_MANAGER", "ADMIN"] },
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    let updatedCount = 0;

    // 3. Process each overdue allocation
    for (const alloc of overdueAllocations) {
      await db.$transaction(async (tx) => {
        // Set allocation status to OVERDUE
        await tx.allocation.update({
          where: { id: alloc.id },
          data: { status: "OVERDUE" },
        });

        // Update asset status (if allocated, we keep it allocated but flag the allocation)
        // No status change on Asset model itself, but allocation is marked OVERDUE.
      });

      updatedCount++;

      // Create notification for the holder
      if (alloc.userId) {
        await createNotification({
          userId: alloc.userId,
          type: "OVERDUE_ALERT",
          title: "Asset Return Overdue!",
          message: `Your allocation for asset "${alloc.asset.name}" (${alloc.asset.assetTag}) was due on ${alloc.expectedReturnDate?.toLocaleDateString()} and is now OVERDUE. Please return it.`,
          entityType: "Asset",
          entityId: alloc.assetId,
        });

        // Log system activity
        await logActivity({
          userId: alloc.userId,
          action: "OVERDUE_DETECTED",
          entityType: "Allocation",
          entityId: alloc.id,
        });
      }

      // Create notifications for managers
      for (const manager of managers) {
        await createNotification({
          userId: manager.id,
          type: "OVERDUE_ALERT",
          title: "Allocation Overdue Notice",
          message: `User ${alloc.user?.name || "Employee"} is overdue returning asset "${alloc.asset.name}" (${alloc.asset.assetTag}). Due date was ${alloc.expectedReturnDate?.toLocaleDateString()}.`,
          entityType: "Asset",
          entityId: alloc.assetId,
        });
      }
    }

    return NextResponse.json({
      message: `Successfully updated overdue allocations.`,
      count: updatedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process overdue allocations check" },
      { status: 500 }
    );
  }
}
