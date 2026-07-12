"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Tabs } from "@/components/ui";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from "recharts";
import { 
  TrendingUp, 
  Wrench, 
  Building, 
  Clock, 
  Download, 
  AlertTriangle, 
  BarChart3, 
  PieChart, 
  Activity, 
  CalendarDays,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";

interface ReportsClientProps {
  currentUser: any;
}

export default function ReportsClient({ currentUser }: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState("utilization");

  // Report data states
  const [utilizationData, setUtilizationData] = useState<any>(null);
  const [maintenanceData, setMaintenanceData] = useState<any>(null);
  const [departmentData, setDepartmentData] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);

  // Loading states
  const [loading, setLoading] = useState(true);

  // Fetch report data based on active tab
  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      try {
        let res;
        if (activeTab === "utilization" && !utilizationData) {
          res = await fetch("/api/reports/utilization");
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setUtilizationData(data);
        } else if (activeTab === "maintenance" && !maintenanceData) {
          res = await fetch("/api/reports/maintenance");
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setMaintenanceData(data);
        } else if (activeTab === "department" && !departmentData) {
          res = await fetch("/api/reports/department");
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setDepartmentData(data);
        } else if (activeTab === "heatmap" && !heatmapData) {
          res = await fetch("/api/reports/booking-heatmap");
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setHeatmapData(data);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load report data");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [activeTab]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  // Helper for downloading CSV files client-side
  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("No data available to export");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} exported successfully.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Monitor asset utilization, lifecycles, and maintenance trends</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <Tabs
          tabs={[
            { id: "utilization", label: "Asset Utilization", icon: <TrendingUp className="h-4 w-4" /> },
            { id: "maintenance", label: "Maintenance Stats", icon: <Wrench className="h-4 w-4" /> },
            { id: "department", label: "Department Summary", icon: <Building className="h-4 w-4" /> },
            { id: "heatmap", label: "Booking Heatmap", icon: <CalendarDays className="h-4 w-4" /> },
            { id: "export", label: "Export Data", icon: <Download className="h-4 w-4" /> },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
          <p className="text-sm font-semibold text-foreground">Generating report metrics...</p>
        </div>
      )}

      {/* Tabs Content */}
      {!loading && activeTab === "utilization" && utilizationData && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Card */}
            <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Category-wise Utilization
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={utilizationData.utilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total Assets" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="active" name="In Use (Allocated/Reserved)" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Overall Rate Card */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Key Performance Indexes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-muted/30 text-center">
                  <span className="text-3xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Global Asset Count
                  </span>
                  <span className="text-3xl font-extrabold text-foreground mt-1 block">
                    {utilizationData.utilization.reduce((sum: number, c: any) => sum + c.total, 0)}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/30 text-center">
                  <span className="text-3xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Average Utilization Rate
                  </span>
                  <span className="text-3xl font-extrabold text-success mt-1 block">
                    {Math.round(
                      (utilizationData.utilization.reduce((sum: number, c: any) => sum + c.active, 0) /
                        Math.max(
                          utilizationData.utilization.reduce((sum: number, c: any) => sum + c.total, 0),
                          1
                        )) *
                        100
                    )}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage ranking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">Most Allocated Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {utilizationData.mostActive.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No allocation history available.</p>
                ) : (
                  utilizationData.mostActive.map((item: any, idx: number) => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg border border-border bg-muted/10">
                      <div>
                        <span className="font-semibold text-foreground">{item.name}</span>
                        <span className="block text-3xs font-mono text-muted-foreground mt-0.5">{item.assetTag}</span>
                      </div>
                      <Badge variant="secondary">{item.totalUsage} times allocated</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">Idle Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {utilizationData.idle.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">All registered assets have been allocated or booked.</p>
                ) : (
                  utilizationData.idle.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg border border-border bg-muted/10">
                      <div>
                        <span className="font-semibold text-foreground">{item.name}</span>
                        <span className="block text-3xs font-mono text-muted-foreground mt-0.5">{item.assetTag}</span>
                      </div>
                      <Badge variant="destructive">{item.status}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!loading && activeTab === "maintenance" && maintenanceData && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Frequency Chart */}
            <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" /> Tickets & Resolution Time (Hours)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={maintenanceData.frequency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Total Tickets" fill="#FF8042" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgResolutionHours" name="Avg Resolution (Hrs)" fill="#FFBB28" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Priorities Pie */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" /> Ticket Priority density
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[230px] flex flex-col justify-between items-center">
                <ResponsiveContainer width="100%" height="70%">
                  <RechartsPieChart>
                    <Pie
                      data={maintenanceData.priorities}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {maintenanceData.priorities.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                {/* Labels legend */}
                <div className="flex flex-wrap gap-2 text-3xs font-semibold justify-center">
                  {maintenanceData.priorities.map((item: any, idx: number) => (
                    <span key={item.priority} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {item.priority}: {item.count}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Table Grid */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">Category-wise Maintenance Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={maintenanceData.frequency}
                columns={[
                  {
                    accessorKey: "category",
                    header: "Asset Category",
                    cell: ({ row }) => <span className="font-semibold">{row.getValue("category")}</span>,
                  },
                  {
                    accessorKey: "count",
                    header: "Total Tickets Raised",
                  },
                  {
                    accessorKey: "resolved",
                    header: "Resolved Tickets",
                  },
                  {
                    accessorKey: "avgResolutionHours",
                    header: "Avg Resolution Time",
                    cell: ({ row }) => <span>{row.getValue("avgResolutionHours")} Hours</span>,
                  },
                  {
                    accessorKey: "dueForMaintenance",
                    header: "Assets Due for Maintenance",
                    cell: ({ row }) => {
                      const count = row.getValue("dueForMaintenance") as number;
                      return count > 0 ? (
                        <Badge className="font-bold border border-red-500/20 bg-red-500/10 text-red-500">
                          {count} {count === 1 ? "Asset" : "Assets"} Due
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">0 / Clean</span>
                      );
                    },
                  },
                ]}
                emptyMessage="No category-wise maintenance statistics available."
              />
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && activeTab === "department" && departmentData && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Counts Chart */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">Allocated Asset Volume per Dept</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={departmentData.summary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="code" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="assetCount" name="Assets Held" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Total Cost Chart */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold text-foreground">Total Acquisition Cost per Dept ($)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={departmentData.summary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="code" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalCost" name="Total Value" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!loading && activeTab === "heatmap" && heatmapData && (
        <Card className="shadow-md animate-in fade-in-50 duration-200">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Booking Hour × Weekday Heatmap Grid
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[650px] space-y-4">
              <div className="grid grid-cols-[80px_repeat(24,_1fr)] gap-1 text-center font-mono text-3xs font-semibold text-muted-foreground mb-1">
                <div>Weekday</div>
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h}>{String(h).padStart(2, "0")}</div>
                ))}
              </div>

              {/* Rows: Sun (0) to Sat (6) */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, dayIdx) => {
                return (
                  <div key={dayIdx} className="grid grid-cols-[80px_repeat(24,_1fr)] gap-1 items-center">
                    <div className="font-semibold text-xs text-foreground text-left">{dayName}</div>
                    {Array.from({ length: 24 }, (_, hourIdx) => {
                      // Find count in heatmapData.heatmap
                      const cell = heatmapData.heatmap.find(
                        (h: any) => h.day === dayIdx && h.hour === hourIdx
                      );
                      const count = cell ? cell.count : 0;

                      // Decide color density
                      let bgClass = "bg-muted/10";
                      if (count > 0 && count <= 2) bgClass = "bg-primary/20 text-primary-foreground";
                      else if (count > 2 && count <= 5) bgClass = "bg-primary/50 text-primary-foreground";
                      else if (count > 5) bgClass = "bg-primary text-primary-foreground";

                      return (
                        <div
                          key={hourIdx}
                          className={`aspect-square rounded flex items-center justify-center font-bold text-4xs transition-colors hover:ring-1 hover:ring-ring ${bgClass}`}
                          title={`${dayName} at ${String(hourIdx).padStart(2, "0")}:00: ${count} bookings`}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            {/* Heatmap color guide */}
            <div className="flex gap-4 text-3xs font-semibold justify-end mt-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-muted/20 border border-border" /> 0 bookings
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-primary/20" /> 1-2 bookings
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-primary/50" /> 3-5 bookings
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-primary" /> 6+ bookings
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && activeTab === "export" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-200">
          {/* Export Utilization */}
          <Card className="shadow-md flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base font-bold">Asset Utilization Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Export category utilization percentages, active asset volumes, and total asset counts.
              </p>
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/reports/utilization");
                    const data = await res.json();
                    downloadCSV(data.utilization, "utilization_report.csv");
                  } catch {
                    toast.error("Failed to fetch utilization data for export.");
                  }
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </CardContent>
          </Card>

          {/* Export Maintenance */}
          <Card className="shadow-md flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base font-bold">Maintenance Ticket History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Export ticket frequencies by category and average repair durations (hours).
              </p>
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/reports/maintenance");
                    const data = await res.json();
                    downloadCSV(data.frequency, "maintenance_report.csv");
                  } catch {
                    toast.error("Failed to fetch maintenance data for export.");
                  }
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </CardContent>
          </Card>

          {/* Export Departments */}
          <Card className="shadow-md flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base font-bold">Department Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Export active asset counts and cumulative asset values grouped by department code.
              </p>
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/reports/department");
                    const data = await res.json();
                    downloadCSV(data.summary, "department_report.csv");
                  } catch {
                    toast.error("Failed to fetch department summary data for export.");
                  }
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
