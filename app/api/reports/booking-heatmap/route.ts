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
    const bookings = await db.booking.findMany({
      where: {
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        startTime: true,
      },
    });

    // Initialize 7x24 grid (7 days: 0-6, 24 hours: 0-23)
    const grid: Record<string, number> = {};
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        grid[`${d}-${h}`] = 0;
      }
    }

    // Populate grid
    bookings.forEach((b) => {
      const date = new Date(b.startTime);
      const day = date.getDay(); // 0 is Sunday, 6 is Saturday
      const hour = date.getHours(); // 0-23
      grid[`${day}-${hour}`] += 1;
    });

    const heatmap = Object.entries(grid).map(([key, count]) => {
      const [day, hour] = key.split("-").map(Number);
      return {
        day,
        hour,
        count,
      };
    });

    return NextResponse.json({
      heatmap,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate heatmap report" },
      { status: 500 }
    );
  }
}
