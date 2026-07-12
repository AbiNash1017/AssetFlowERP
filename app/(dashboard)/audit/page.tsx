import React from "react";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getServerSession } from "@/lib/rbac-server";
import { Role } from "@prisma/client";
import AuditClient from "@/components/audit/AuditClient";

export default async function AuditPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user.role as Role) || "EMPLOYEE";
  const isManager = ["ASSET_MANAGER", "ADMIN"].includes(userRole);

  // Fetch cycles: managers see all, auditors see assigned ones
  const cycles = await db.auditCycle.findMany({
    where: isManager ? undefined : {
      assignments: {
        some: {
          auditorId: session.user.id,
        },
      },
    },
    include: {
      assignments: {
        include: {
          auditor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      entries: {
        select: {
          id: true,
          result: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate scope counts for each cycle
  const cyclesWithStats = await Promise.all(
    cycles.map(async (cycle) => {
      let scopeAssetCount = 0;
      if (cycle.scope === "DEPARTMENT") {
        // Count active allocations directly to this department OR to employees of this department
        scopeAssetCount = await db.asset.count({
          where: {
            status: { notIn: ["RETIRED", "DISPOSED"] },
            allocations: {
              some: {
                status: "ACTIVE",
                OR: [
                  { departmentId: cycle.scopeId },
                  { user: { departmentId: cycle.scopeId } },
                ],
              },
            },
          },
        });
      } else {
        // Location scope: count assets in this location
        scopeAssetCount = await db.asset.count({
          where: {
            location: { equals: cycle.scopeId, mode: "insensitive" },
            status: { notIn: ["RETIRED", "DISPOSED"] },
          },
        });
      }

      const auditedCount = cycle.entries.length;

      return {
        ...cycle,
        totalAssets: scopeAssetCount,
        auditedCount,
      };
    })
  );

  // Fetch departments to populate creation form
  const departments = await db.department.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch users to populate auditor assignment dropdown
  const users = await db.user.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Serialize dates
  const serializedCycles = cyclesWithStats.map((c) => ({
    ...c,
    startDate: c.startDate.toISOString(),
    endDate: c.endDate.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AuditClient
        initialCycles={serializedCycles}
        departments={departments}
        users={users}
        currentUser={session.user}
      />
    </div>
  );
}
