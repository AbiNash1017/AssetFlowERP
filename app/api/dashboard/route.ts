import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSession } from "@/lib/rbac-server";

export async function GET() {
  try {
    await requireSession();
    
    const now = new Date();
    
    const [
      availableAssets,
      allocatedAssets,
      activeBookings,
      maintenanceToday,
      pendingTransfers,
      upcomingReturns,
      overdueReturns
    ] = await Promise.all([
      db.asset.count({ where: { status: "AVAILABLE" } }),
      db.asset.count({ where: { status: "ALLOCATED" } }),
      db.booking.count({ where: { status: "ONGOING" } }),
      db.maintenanceRequest.count({ where: { status: "IN_PROGRESS" } }),
      db.transferRequest.count({ where: { status: "PENDING" } }),
      db.allocation.count({
        where: {
          status: "ACTIVE",
          expectedReturnDate: { gte: now }
        }
      }),
      db.allocation.count({
        where: {
          OR: [
            { status: "OVERDUE" },
            {
              status: "ACTIVE",
              expectedReturnDate: { lt: now }
            }
          ]
        }
      })
    ]);

    return NextResponse.json({
      availableAssets,
      allocatedAssets,
      activeBookings,
      maintenanceToday,
      pendingTransfers,
      upcomingReturns,
      overdueReturns
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
