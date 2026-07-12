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
    // 1. Fetch departments
    const departments = await db.department.findMany({
      where: {
        status: "ACTIVE",
      },
    });

    // 2. Compute allocation metrics for each department
    const summary = await Promise.all(
      departments.map(async (dept) => {
        // Query active allocations directly assigned to this department
        // OR assigned to users who are members of this department
        const activeAllocations = await db.allocation.findMany({
          where: {
            status: "ACTIVE",
            OR: [
              { departmentId: dept.id },
              { user: { departmentId: dept.id } },
            ],
          },
          include: {
            asset: {
              select: {
                acquisitionCost: true,
              },
            },
          },
        });

        const assetCount = activeAllocations.length;
        const totalCost = activeAllocations.reduce((sum, alloc) => {
          return sum + Number(alloc.asset.acquisitionCost);
        }, 0);

        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          assetCount,
          totalCost: Math.round(totalCost * 100) / 100,
        };
      })
    );

    return NextResponse.json({
      summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate department report" },
      { status: 500 }
    );
  }
}
