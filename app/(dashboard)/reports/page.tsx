import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/rbac-server";
import { Role } from "@prisma/client";
import ReportsClient from "@/components/reports/ReportsClient";

export default async function ReportsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user.role as Role) || "EMPLOYEE";
  const isAuthorized = ["DEPARTMENT_HEAD", "ASSET_MANAGER", "ADMIN"].includes(userRole);

  if (!isAuthorized) {
    redirect("/");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ReportsClient currentUser={session.user} />
    </div>
  );
}
