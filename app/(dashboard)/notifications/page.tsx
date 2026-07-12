import React from "react";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getServerSession } from "@/lib/rbac-server";
import { Role } from "@prisma/client";
import NotificationsClient from "@/components/notifications/NotificationsClient";

export default async function NotificationsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user.role as Role) || "EMPLOYEE";
  const isManager = ["ASSET_MANAGER", "ADMIN"].includes(userRole);

  // Fetch notifications for current user
  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch global activity logs (for admins/managers only)
  let activityLogs: any[] = [];
  if (isManager) {
    activityLogs = await db.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to recent 100 entries for performance
    });
  }

  // Serialize dates
  const serializedNotifications = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  const serializedLogs = activityLogs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <NotificationsClient
        initialNotifications={serializedNotifications}
        initialLogs={serializedLogs}
        currentUser={session.user}
      />
    </div>
  );
}
