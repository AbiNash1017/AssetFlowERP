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
    // 1. Fetch categories with asset status breakdown
    const categories = await db.assetCategory.findMany({
      include: {
        assets: {
          select: {
            status: true,
          },
        },
      },
    });

    const utilization = categories.map((cat) => {
      const total = cat.assets.length;
      const active = cat.assets.filter(
        (a) => a.status === "ALLOCATED" || a.status === "RESERVED"
      ).length;
      const rate = total > 0 ? Math.round((active / total) * 100) : 0;

      return {
        id: cat.id,
        name: cat.name,
        total,
        active,
        rate,
      };
    });

    // 2. Fetch assets with allocations and bookings count for usage ranking
    const assets = await db.asset.findMany({
      where: {
        status: { notIn: ["RETIRED", "DISPOSED"] },
      },
      include: {
        _count: {
          select: {
            allocations: true,
            bookings: true,
          },
        },
      },
    });

    const assetsWithUsage = assets.map((a) => ({
      id: a.id,
      name: a.name,
      assetTag: a.assetTag,
      status: a.status,
      allocationsCount: a._count.allocations,
      bookingsCount: a._count.bookings,
      totalUsage: a._count.allocations + a._count.bookings,
    }));

    // Sort to get most active vs idle
    const mostActive = [...assetsWithUsage]
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 10);

    const idle = assetsWithUsage
      .filter((a) => a.totalUsage === 0)
      .slice(0, 10);

    return NextResponse.json({
      utilization,
      mostActive,
      idle,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate utilization report" },
      { status: 500 }
    );
  }
}
