import React from "react";
import db from "@/lib/db";
import { requireSession } from "@/lib/rbac-server";
import AllocationClient from "@/components/allocation/AllocationClient";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AllocationPage() {
  const session = await requireSession();

  // Fetch all allocations, transfer requests, assets, users, and departments in parallel
  const [allocations, transfers, assets, users, departments] = await Promise.all([
    db.allocation.findMany({
      include: {
        asset: true,
        user: true,
        department: true,
      },
      orderBy: {
        allocatedAt: "desc",
      },
    }),
    db.transferRequest.findMany({
      include: {
        asset: true,
        fromUser: true,
        toUser: true,
        requestedBy: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.asset.findMany({
      orderBy: {
        assetTag: "asc",
      },
    }),
    db.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    db.department.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
  ]);

  const currentUser = {
    id: session.user.id,
    role: (session.user.role as Role) || "EMPLOYEE",
    departmentId: session.user.departmentId || null,
  };

  const serializedAllocations = allocations.map((alloc) => ({
    ...alloc,
    asset: alloc.asset ? {
      ...alloc.asset,
      acquisitionCost: Number(alloc.asset.acquisitionCost),
    } : null,
  }));

  const serializedTransfers = transfers.map((transfer) => ({
    ...transfer,
    asset: transfer.asset ? {
      ...transfer.asset,
      acquisitionCost: Number(transfer.asset.acquisitionCost),
    } : null,
  }));

  const serializedAssets = assets.map((asset) => ({
    ...asset,
    acquisitionCost: Number(asset.acquisitionCost),
  }));

  return (
    <AllocationClient
      allocations={serializedAllocations}
      transfers={serializedTransfers}
      assets={serializedAssets}
      users={users}
      departments={departments}
      currentUser={currentUser}
    />
  );
}
