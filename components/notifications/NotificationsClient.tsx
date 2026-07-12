"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Tabs } from "@/components/ui";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Bell, 
  History, 
  CheckCheck, 
  Trash2, 
  Package, 
  Calendar, 
  Wrench, 
  ClipboardCheck, 
  UserPlus, 
  Building,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface NotificationsClientProps {
  initialNotifications: any[];
  initialLogs: any[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

function getNotificationIcon(type: string) {
  const t = type.toUpperCase();
  if (t.includes("ALLOCATION")) return <Package className="h-4 w-4 text-blue-500" />;
  if (t.includes("BOOKING")) return <Calendar className="h-4 w-4 text-purple-500" />;
  if (t.includes("MAINTENANCE")) return <Wrench className="h-4 w-4 text-amber-500" />;
  if (t.includes("AUDIT")) return <ClipboardCheck className="h-4 w-4 text-emerald-500" />;
  if (t.includes("ROLE") || t.includes("STATUS") || t.includes("EMPLOYEE")) return <UserPlus className="h-4 w-4 text-indigo-500" />;
  if (t.includes("DEPARTMENT")) return <Building className="h-4 w-4 text-cyan-500" />;
  return <Bell className="h-4 w-4 text-muted-foreground" />;
}

function getIndicatorColor(type: string) {
  const t = type.toUpperCase();
  if (t.includes("ALERT") || t.includes("DISCREPANCY")) return "bg-red-500";
  if (t.includes("APPROVED")) return "bg-emerald-500";
  if (t.includes("REJECTED")) return "bg-rose-500";
  if (t.includes("BOOKING")) return "bg-blue-500";
  if (t.includes("ALLOCATION")) return "bg-indigo-500";
  return "bg-slate-400";
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

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
    case "BOOK_RESOURCE":
      return `${userName} reserved resource: "${meta?.title || ""}"`;
    case "CANCEL_BOOKING":
      return `${userName} cancelled a booking`;
    case "RESCHEDULE_BOOKING":
      return `${userName} rescheduled a booking`;
    case "CREATE_AUDIT_CYCLE":
      return `${userName} started a new audit cycle: "${meta?.name || ""}"`;
    case "RECORD_AUDIT_ENTRY":
      return `${userName} recorded audit verification for asset: ${meta?.result || ""}`;
    case "CLOSE_AUDIT_CYCLE":
      return `${userName} closed and finalized audit cycle`;
    default:
      return `${userName} performed ${activity.action.replace(/_/g, " ").toLowerCase()}`;
  }
}

export default function NotificationsClient({
  initialNotifications,
  initialLogs,
  currentUser,
}: NotificationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("notifications");
  const [notifications, setNotifications] = useState(initialNotifications);

  const isManager = ["ASSET_MANAGER", "ADMIN"].includes(currentUser.role);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("All notifications marked as read.");
        router.refresh();
      } else {
        toast.error("Failed to mark notifications as read.");
      }
    } catch {
      toast.error("Error connecting to server.");
    }
  };

  const handleMarkIndividualRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to mark single read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const [subFilter, setSubFilter] = useState<"ALL" | "ALERTS" | "APPROVALS" | "BOOKINGS">("ALL");

  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((n) => {
      const type = n.type.toUpperCase();
      if (subFilter === "ALERTS") {
        return type.includes("ALERT") || type.includes("DISCREPANCY");
      }
      if (subFilter === "APPROVALS") {
        return (
          type.includes("APPROVED") ||
          type.includes("REJECTED") ||
          type.includes("TRANSFER") ||
          type.includes("ASSIGNED") ||
          type.includes("RESOLVED")
        );
      }
      if (subFilter === "BOOKINGS") {
        return type.includes("BOOKING");
      }
      return true;
    });
  }, [notifications, subFilter]);

  const logColumns: ColumnDef<any>[] = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">
          {new Date(row.getValue("createdAt")).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-3xs font-bold uppercase whitespace-nowrap">
          {(row.getValue("action") as string).replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground">
          {getActivityDescription(row.original)}
        </span>
      ),
    },
    {
      accessorKey: "entityType",
      header: "Target Entity",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.getValue("entityType")} ({row.original.entityId?.slice(0, 8)}...)
        </span>
      ),
    },
  ];

  const tabOptions: any[] = [
    { id: "notifications", label: "My Notifications", icon: <Bell className="h-4 w-4" />, badge: unreadCount },
  ];

  if (isManager) {
    tabOptions.push({
      id: "logs",
      label: "Activity Logs",
      icon: <History className="h-4 w-4" />,
      badge: undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity Log & Notification</h1>
          <p className="text-muted-foreground">View your notifications, updates, and system-wide action audits</p>
        </div>
        {activeTab === "notifications" && unreadCount > 0 && (
          <Button onClick={handleMarkAllRead} variant="outline" className="flex items-center gap-1.5 self-start md:self-auto">
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Render selected tab content */}
      {activeTab === "notifications" ? (
        <Card className="shadow-md">
          <CardContent className="pt-6">
            {/* Sub-filtering pills */}
            <div className="flex gap-2 mb-4 border-b border-border/40 pb-3 flex-wrap">
              {(["ALL", "ALERTS", "APPROVALS", "BOOKINGS"] as const).map((filter) => {
                const isActive = subFilter === filter;
                const count = notifications.filter((n) => {
                  const type = n.type.toUpperCase();
                  if (filter === "ALERTS") return type.includes("ALERT") || type.includes("DISCREPANCY");
                  if (filter === "APPROVALS") return type.includes("APPROVED") || type.includes("REJECTED") || type.includes("TRANSFER") || type.includes("ASSIGNED") || type.includes("RESOLVED");
                  if (filter === "BOOKINGS") return type.includes("BOOKING");
                  return true;
                }).length;

                const labels: Record<string, string> = {
                  ALL: "All",
                  ALERTS: "Alerts",
                  APPROVALS: "Approvals",
                  BOOKINGS: "Bookings",
                };

                return (
                  <button
                    key={filter}
                    onClick={() => setSubFilter(filter)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    {labels[filter]} <span className="opacity-70 font-mono text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="font-semibold">All quiet here</p>
                <p className="text-xs text-muted-foreground/80">No notifications in this category yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 -mx-6 -mb-6">
                {filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkIndividualRead(n.id)}
                    className={`flex items-center justify-between px-6 py-4 transition-colors cursor-pointer hover:bg-muted/10 ${
                      !n.read ? "bg-primary/5 hover:bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getIndicatorColor(n.type)}`} />
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-sm ${!n.read ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                          {n.title} : <span className="font-normal text-muted-foreground">{n.message}</span>
                        </span>
                      </div>
                    </div>
                    <span className="text-3xs text-muted-foreground whitespace-nowrap pl-4 shrink-0 font-medium">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <DataTable columns={logColumns} data={initialLogs} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
