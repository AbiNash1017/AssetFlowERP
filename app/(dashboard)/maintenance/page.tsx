import React from "react";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getServerSession } from "@/lib/rbac-server";
import { Role } from "@prisma/client";
import MaintenanceClient from "@/components/maintenance/MaintenanceClient";

export default async function MaintenancePage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user.role as Role) || "EMPLOYEE";

  // Fetch maintenance requests based on user role
  const requests = await db.maintenanceRequest.findMany({
    where: userRole === "EMPLOYEE" ? { raisedById: session.user.id } : undefined,
    include: {
      asset: true,
      raisedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch active users to populate technician options
  const activeUsers = await db.user.findMany({
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

  // Fetch assets to populate the "Raise Maintenance" dropdown
  // Employees can only request maintenance for their allocated assets?
  // Let's fetch all active/available/allocated assets so they can choose.
  const assets = await db.asset.findMany({
    where: {
      status: {
        notIn: ["RETIRED", "DISPOSED"],
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Serialize dates and nested assets for Client Component safety
  const serializedRequests = requests.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString() || null,
    asset: r.asset ? {
      ...r.asset,
      acquisitionCost: r.asset.acquisitionCost.toString(),
      acquisitionDate: r.asset.acquisitionDate.toISOString(),
      createdAt: r.asset.createdAt.toISOString(),
      updatedAt: r.asset.updatedAt.toISOString(),
    } : null,
  }));

  const serializedAssets = assets.map((a) => ({
    ...a,
    acquisitionCost: a.acquisitionCost.toString(),
    acquisitionDate: a.acquisitionDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <MaintenanceClient
        initialRequests={serializedRequests}
        assets={serializedAssets}
        users={activeUsers}
        currentUser={session.user}
      />
    </div>
  );
}
