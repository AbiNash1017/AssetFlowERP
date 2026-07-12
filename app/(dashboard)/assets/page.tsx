import React from "react";
import db from "@/lib/db";
import { requireSession } from "@/lib/rbac-server";
import AssetsClient from "@/components/assets/AssetsClient";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const session = await requireSession();
  const userRole = (session.user.role as Role) || "EMPLOYEE";

  // Fetch assets and categories from database
  const [assets, categories] = await Promise.all([
    db.asset.findMany({
      include: {
        category: true,
        allocations: {
          where: { status: "ACTIVE" },
          include: {
            user: true,
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
  ]);

  return (
    <AssetsClient
      assets={assets}
      categories={categories}
      userRole={userRole}
    />
  );
}
