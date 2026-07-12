import React from "react";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getServerSession } from "@/lib/rbac-server";
import { Role } from "@prisma/client";
import CycleDetailClient from "@/components/audit/CycleDetailClient";

export default async function AuditCycleDetailPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user.role as Role) || "EMPLOYEE";
  const isManager = ["ASSET_MANAGER", "ADMIN"].includes(userRole);

  // Fetch the audit cycle details
  const cycle = await db.auditCycle.findUnique({
    where: { id: cycleId },
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
        include: {
          auditor: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!cycle) {
    redirect("/audit");
  }

  // Permission Check: must be manager or assigned auditor
  const isAssigned = cycle.assignments.some((a) => a.auditorId === session.user.id);
  if (!isManager && !isAssigned) {
    redirect("/audit");
  }

  // Fetch assets in scope
  let assets: any[] = [];
  if (cycle.scope === "DEPARTMENT") {
    assets = await db.asset.findMany({
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
      include: {
        allocations: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  } else {
    // Location scope
    assets = await db.asset.findMany({
      where: {
        location: { equals: cycle.scopeId, mode: "insensitive" },
        status: { notIn: ["RETIRED", "DISPOSED"] },
      },
      include: {
        allocations: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            department: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  // Fetch the department details if scope is department
  let departmentScopeName = "";
  if (cycle.scope === "DEPARTMENT") {
    const dept = await db.department.findUnique({
      where: { id: cycle.scopeId },
    });
    departmentScopeName = dept ? `${dept.name} (${dept.code})` : "";
  }

  // Serialize models for client safety
  const serializedCycle = {
    ...cycle,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    createdAt: cycle.createdAt.toISOString(),
    updatedAt: cycle.updatedAt.toISOString(),
    entries: cycle.entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  };

  const serializedAssets = assets.map((a) => ({
    ...a,
    acquisitionCost: a.acquisitionCost.toString(),
    acquisitionDate: a.acquisitionDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <CycleDetailClient
        cycle={serializedCycle}
        assets={serializedAssets}
        currentUser={session.user}
        departmentScopeName={departmentScopeName}
      />
    </div>
  );
}
