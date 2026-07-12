import React from "react";
import db from "@/lib/db";
import { requireSession } from "@/lib/rbac-server";
import AssetsClient from "@/components/assets/AssetsClient";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const session = await requireSession();
  const userRole = (session.user.role as Role) || "EMPLOYEE";

  // Fetch assets, categories, and departments from database
  const [assets, categories, departments] = await Promise.all([
    db.asset.findMany({
      include: {
        category: true,
        allocations: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              include: {
                department: true,
              },
            },
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    db.assetCategory.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    db.department.findMany({
      where: { status: "ACTIVE" },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const serializedAssets = assets.map((asset) => ({
    ...asset,
    acquisitionCost: Number(asset.acquisitionCost),
  }));

  return (
    <AssetsClient
      assets={serializedAssets}
      categories={categories}
      departments={departments}
      userRole={userRole}
    />
  );
}
