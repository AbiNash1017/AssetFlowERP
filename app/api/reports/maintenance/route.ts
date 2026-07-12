import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "@/lib/rbac-server";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user.role as Role) || "EMPLOYEE";
  if (!["DEPARTMENT_HEAD", "ASSET_MANAGER", "ADMIN"].includes(userRole)) {
    return NextResponse.json({ error: "Forbidden: Insufficient role permissions" }, { status: 403 });
  }

  try {
    // 1. Fetch maintenance requests with asset categories
    const requests = await db.maintenanceRequest.findMany({
      include: {
        asset: {
          include: {
            category: true,
          },
        },
      },
    });

    // 2. Group by category
    const categoryStats: Record<string, { count: number; resolvedCount: number; totalResolutionTimeMs: number }> = {};
    const priorityStats = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const statusStats = { PENDING: 0, APPROVED: 0, REJECTED: 0, IN_PROGRESS: 0, RESOLVED: 0 };

    requests.forEach((req) => {
      const catName = req.asset.category.name;
      if (!categoryStats[catName]) {
        categoryStats[catName] = { count: 0, resolvedCount: 0, totalResolutionTimeMs: 0 };
      }
      categoryStats[catName].count += 1;

      // Priorities density
      if (req.priority in priorityStats) {
        priorityStats[req.priority as keyof typeof priorityStats] += 1;
      }

      // Status density
      if (req.status in statusStats) {
        statusStats[req.status as keyof typeof statusStats] += 1;
      }

      // Resolution time
      if (req.status === "RESOLVED" && req.resolvedAt) {
        const timeDiff = req.resolvedAt.getTime() - req.createdAt.getTime();
        categoryStats[catName].resolvedCount += 1;
        categoryStats[catName].totalResolutionTimeMs += timeDiff;
      }
    });

    const frequency = Object.entries(categoryStats).map(([category, stats]) => {
      const avgResolutionHours =
        stats.resolvedCount > 0
          ? Math.round(stats.totalResolutionTimeMs / (1000 * 60 * 60 * stats.resolvedCount))
          : 0;

      return {
        category,
        count: stats.count,
        resolved: stats.resolvedCount,
        avgResolutionHours,
      };
    });

    return NextResponse.json({
      frequency,
      priorities: Object.entries(priorityStats).map(([priority, count]) => ({ priority, count })),
      statuses: Object.entries(statusStats).map(([status, count]) => ({ status, count })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate maintenance report" },
      { status: 500 }
    );
  }
}
