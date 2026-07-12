import React from "react";
import { notFound, redirect } from "next/navigation";
import db from "@/lib/db";
import { requireSession } from "@/lib/rbac-server";
import AssetDetailClient from "@/components/assets/AssetDetailClient";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

interface AssetDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const session = await requireSession();
  
  // In Next.js 16, params is a Promise that must be awaited
  const { id } = await params;

  // Parallel fetch: asset detail, user list, department list
  const [asset, users, departments] = await Promise.all([
    db.asset.findUnique({
      where: { id },
      include: {
        category: true,
        allocations: {
          include: {
            user: true,
            department: true,
          },
          orderBy: {
            allocatedAt: "desc",
          },
        },
        maintenanceRequests: {
          include: {
            raisedBy: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
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

  if (!asset) {
    notFound();
  }

  const currentUser = {
    id: session.user.id,
    role: (session.user.role as Role) || "EMPLOYEE",
    departmentId: session.user.departmentId || null,
  };

  return (
    <AssetDetailClient
      asset={asset}
      users={users}
      departments={departments}
      currentUser={currentUser}
    />
  );
}
