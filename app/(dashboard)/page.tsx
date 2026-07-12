import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getServerSession } from "@/lib/rbac-server";
import { permissions } from "@/lib/rbac";
import { THEME } from "@/lib/constants/styles";
import { Role } from "@prisma/client";
import { 
  Package, 
  FolderSync, 
  CalendarDays, 
  Wrench, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  History,
  PlusCircle,
  Clock,
  UserCheck,
  Repeat
} from "lucide-react";

function getActivityDescription(activity: any) {
  const meta = activity.metadata as Record<string, any> | null;
  const userName = activity.user?.name || "System";
  
  switch (activity.action) {
    case "REGISTER_ASSET":
      return `${userName} registered a new asset: ${meta?.name || "Equipment"} (${meta?.assetTag || ""})`;
    case "UPDATE_ASSET":
      return `${userName} updated asset details`;
    case "UPDATE_ASSET_STATUS":
      return `${userName} updated asset status to ${meta?.newStatus || "Unknown"}`;
    case "CREATE_DEPARTMENT":
      return `${userName} created department: ${meta?.name || ""}`;
    case "UPDATE_DEPARTMENT":
      return `${userName} updated department details`;
    case "UPDATE_EMPLOYEE_ROLE":
      return `${userName} changed employee role to ${meta?.newRole || ""}`;
    case "UPDATE_EMPLOYEE_STATUS":
      return `${userName} updated employee status to ${meta?.newStatus || ""}`;
    case "ALLOCATE_ASSET":
      return `${userName} allocated asset to employee`;
    case "RETURN_ASSET":
      return `${userName} processed asset return`;
    case "CREATE_TRANSFER_REQUEST":
      return `${userName} requested asset transfer`;
    case "APPROVE_TRANSFER_REQUEST":
      return `${userName} approved asset transfer`;
    case "REJECT_TRANSFER_REQUEST":
      return `${userName} rejected asset transfer`;
    default:
      return `${userName} performed ${activity.action.replace(/_/g, " ").toLowerCase()}`;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user.role as Role) || "EMPLOYEE";
  const now = new Date();

  // Parallel database queries
  const [
    availableCount,
    allocatedCount,
    activeBookingsCount,
    maintenanceTodayCount,
    pendingTransfersCount,
    upcomingReturnsCount,
    overdueCount,
    overdueItems,
    recentActivities
  ] = await Promise.all([
    db.asset.count({ where: { status: "AVAILABLE" } }),
    db.asset.count({ where: { status: "ALLOCATED" } }),
    db.booking.count({ where: { status: "ONGOING" } }),
    db.maintenanceRequest.count({ where: { status: "IN_PROGRESS" } }),
    db.transferRequest.count({ where: { status: "PENDING" } }),
    db.allocation.count({ where: { status: "ACTIVE", expectedReturnDate: { gte: now } } }),
    db.allocation.count({
      where: {
        OR: [
          { status: "OVERDUE" },
          { status: "ACTIVE", expectedReturnDate: { lt: now } }
        ]
      }
    }),
    db.allocation.findMany({
      where: {
        OR: [
          { status: "OVERDUE" },
          { status: "ACTIVE", expectedReturnDate: { lt: now } }
        ]
      },
      include: {
        asset: true,
        user: true
      },
      orderBy: {
        expectedReturnDate: "asc"
      },
      take: 5
    }),
    db.activityLog.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: true
      },
      take: 5
    })
  ]);

  const kpis = [
    { name: "Assets Available", value: String(availableCount), change: "Ready for deployment", icon: Package, color: "text-primary bg-primary/10 border-primary/20" },
    { name: "Assets Allocated", value: String(allocatedCount), change: "Held by employees/depts", icon: FolderSync, color: "text-secondary bg-secondary/10 border-secondary/20" },
    { name: "Active Bookings", value: String(activeBookingsCount), change: "Ongoing reservations", icon: CalendarDays, color: "text-teal-brand bg-teal-brand/10 border-teal-brand/20" },
    { name: "Maintenance Today", value: String(maintenanceTodayCount), change: "Currently in repair", icon: Wrench, color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
    { name: "Pending Transfers", value: String(pendingTransfersCount), change: "Awaiting approval", icon: Repeat, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
    { name: "Upcoming Returns", value: String(upcomingReturnsCount), change: "Due for return soon", icon: Clock, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-white shadow-md border border-primary/20">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full bg-secondary/30 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome back, {session.user.name || "User"}!</h1>
            <p className="mt-1 text-sm text-white/80">
              Here is your AssetFlow ERP dashboard snapshot. Role: <span className="font-bold underline">{userRole.replace("_", " ")}</span>
            </p>
          </div>
          
          <div className="inline-flex items-center rounded-lg bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
            <span className="mr-1.5 flex h-2 w-2 rounded-full bg-emerald-400"></span>
            System Live
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.name} className={`${THEME.classes.card} ${THEME.classes.cardHover} flex items-start justify-between`}>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{kpi.name}</span>
                <div className="text-3xl font-extrabold text-foreground">{kpi.value}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span>{kpi.change}</span>
                </div>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg border ${kpi.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Overdue returns / Quick Actions & Activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Overdue Items & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue returns card */}
          <div className={`${THEME.classes.card} border-destructive/30 bg-destructive/5`}>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="text-lg font-bold text-foreground">Critical Overdue Returns</h3>
              </div>
              <span className="text-xs font-bold bg-destructive/15 text-destructive px-2.5 py-0.5 rounded-full border border-destructive/20">
                {overdueCount} Total Overdue
              </span>
            </div>
            <div className="mt-4 divide-y divide-border">
              {overdueItems.length > 0 ? (
                overdueItems.map((item) => {
                  const daysLate = Math.max(
                    1,
                    Math.ceil((now.getTime() - new Date(item.expectedReturnDate || now).getTime()) / (1000 * 60 * 60 * 24))
                  );
                  return (
                    <div key={item.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/15">
                            {item.asset.assetTag}
                          </span>
                          <span className="font-semibold text-sm text-foreground">{item.asset.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Held by <span className="font-medium text-foreground">{item.user?.name || "Unknown"}</span> · Due since {item.expectedReturnDate ? new Date(item.expectedReturnDate).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive/10">
                          {daysLate} {daysLate === 1 ? "day" : "days"} late
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">No overdue allocations. Excellent!</div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className={THEME.classes.card}>
            <div className="pb-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">Quick Action Operations</h3>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {permissions.canRegisterAsset(userRole) ? (
                <Link href="/assets" className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted hover:bg-primary/5 border border-border hover:border-primary/30 transition-all text-center group cursor-pointer">
                  <PlusCircle className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm text-foreground">Register Asset</span>
                  <span className="text-3xs text-muted-foreground mt-1">Add new equipment catalog</span>
                </Link>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/40 border border-dashed border-border text-center opacity-65">
                  <PlusCircle className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="font-semibold text-sm text-muted-foreground">Register Asset</span>
                  <span className="text-3xs text-muted-foreground mt-1">Asset Managers / Admins only</span>
                </div>
              )}

              <Link href="/bookings" className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted hover:bg-secondary/5 border border-border hover:border-secondary/30 transition-all text-center group cursor-pointer">
                <CalendarDays className="h-6 w-6 text-secondary mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm text-foreground">Book Resource</span>
                <span className="text-3xs text-muted-foreground mt-1">Reserve office spaces or devices</span>
              </Link>

              <Link href="/maintenance" className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted hover:bg-teal-brand/5 border border-border hover:border-teal-brand/30 transition-all text-center group cursor-pointer">
                <Wrench className="h-6 w-6 text-teal-brand mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm text-foreground">Raise Request</span>
                <span className="text-3xs text-muted-foreground mt-1">Report damaged devices</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activities */}
        <div className={THEME.classes.card}>
          <div className="flex items-center gap-2 pb-4 border-b border-border">
            <History className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Audit Activity Logs</h3>
          </div>
          
          <div className="mt-4 flow-root">
            {recentActivities.length > 0 ? (
              <ul role="list" className="-mb-8">
                {recentActivities.map((activity, idx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {idx !== recentActivities.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-border text-primary">
                            <Clock className="h-4 w-4" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <p className="text-xs font-semibold text-foreground leading-normal">
                            {getActivityDescription(activity)}
                          </p>
                          <span className="inline-block text-3xs text-muted-foreground mt-1">
                            {new Date(activity.createdAt).toLocaleDateString()} {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">No recent system activities logged.</div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-border">
            <Link href="/notifications" className="flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
              <span>View full activity logs</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
