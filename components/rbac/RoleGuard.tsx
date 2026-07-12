"use client";

import React from "react";
import { useSession } from "@/lib/auth-client";
import { Role } from "@prisma/client";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return null; // Silent during loading or you could render a skeleton/spinner
  }

  // Better Auth additionalFields are not typed by default — cast through unknown
  const userRole = (session?.user as unknown as { role?: Role })?.role;
  
  if (!session || !userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
export default RoleGuard;
