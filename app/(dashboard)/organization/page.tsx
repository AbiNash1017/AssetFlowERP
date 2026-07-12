import React from "react";
import db from "@/lib/db";
import { requireRole } from "@/lib/rbac-server";
import OrganizationClient from "@/components/organization/OrganizationClient";

export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
  // Ensure only Admins can access this setup dashboard
  await requireRole(["ADMIN"]);

  // Parallel fetch of required entity collections
  const [departments, categories, employees] = await Promise.all([
    db.department.findMany({
      include: {
        parentDepartment: true,
        head: true,
        employees: true,
      },
      orderBy: { name: "asc" },
    }),
    db.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      include: {
        department: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <OrganizationClient
      departments={departments}
      categories={categories}
      employees={employees}
    />
  );
}
