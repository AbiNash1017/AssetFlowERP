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
    // 1. Fetch categories and active assets due for maintenance (condition POOR or FAIR)
    const [allCategories, requests, dueAssets] = await Promise.all([
      db.assetCategory.findMany({}),
      db.maintenanceRequest.findMany({
        include: {
          asset: {
            include: {
              category: true,
            },
          },
        },
      }),
      db.asset.findMany({
        where: {
          status: { notIn: ["RETIRED", "DISPOSED"] },
          condition: { in: ["POOR", "FAIR"] },
        },
        select: {
          categoryId: true,
        },
      }),
    ]);

    // Count due assets per category ID
    const categoryDueCounts: Record<string, number> = {};
    dueAssets.forEach((a) => {
      categoryDueCounts[a.categoryId] = (categoryDueCounts[a.categoryId] || 0) + 1;
    });

    // 2. Initialize and group by category
    const categoryStats: Record<string, { id: string; count: number; resolvedCount: number; totalResolutionTimeMs: number }> = {};
    allCategories.forEach((cat) => {
      categoryStats[cat.name] = { id: cat.id, count: 0, resolvedCount: 0, totalResolutionTimeMs: 0 };
    });

    const priorityStats = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    const statusStats = { PENDING: 0, APPROVED: 0, REJECTED: 0, IN_PROGRESS: 0, RESOLVED: 0 };

    requests.forEach((req) => {
      const catName = req.asset.category.name;
      // Safeguard if a category was deleted/missing
      if (!categoryStats[catName]) {
        categoryStats[catName] = { id: req.asset.category.id, count: 0, resolvedCount: 0, totalResolutionTimeMs: 0 };
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
        dueForMaintenance: categoryDueCounts[stats.id] || 0,
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
