"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { THEME } from "@/lib/constants/styles";
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
  Clock
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  // Mock data for premium initial state matching the design from the images
  const kpis = [
    { name: "Assets Available", value: "42", change: "+4 this week", icon: Package, color: "text-primary bg-primary/10 border-primary/20" },
    { name: "Assets Allocated", value: "128", change: "+12 this month", icon: FolderSync, color: "text-secondary bg-secondary/10 border-secondary/20" },
    { name: "Active Bookings", value: "8", change: "3 ongoing now", icon: CalendarDays, color: "text-teal-brand bg-teal-brand/10 border-teal-brand/20" },
    { name: "Maintenance Today", value: "2", change: "1 in progress", icon: Wrench, color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  ];

  const recentActivities = [
    { id: 1, action: "Asset Allocated", detail: "MacBook Pro AF-0124 to Achala Sharma", time: "10 mins ago", type: "allocation" },
    { id: 2, action: "Booking Created", detail: "Conference Room B2 booked by Abinash Das", time: "1 hour ago", type: "booking" },
    { id: 3, action: "Maintenance Resolved", detail: "Projector AF-0098 lens repair completed", time: "3 hours ago", type: "maintenance" },
    { id: 4, action: "Transfer Requested", detail: "Tablet AF-0442 transfer from Rakshitha M B", time: "5 hours ago", type: "transfer" },
  ];

  const overdueItems = [
    { id: 1, tag: "AF-0112", name: "Dell Monitor 24\"", holder: "Ashwini30251", dueDate: "Jul 10, 2026", daysOverdue: 2 },
    { id: 2, tag: "AF-0056", name: "Testing Phone (Pixel 8)", holder: "Rakshitha M B", dueDate: "Jul 08, 2026", daysOverdue: 4 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-primary p-6 text-white shadow-md border border-primary/20">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full bg-secondary/30 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col justify-between sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome back, {session?.user?.name || "User"}!</h1>
            <p className="mt-1 text-sm text-white/80">
              Here is the operational snapshot for the Odoo Hackathon 2026 asset catalog.
            </p>
          </div>
          
          <div className="inline-flex items-center rounded-lg bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
            <span className="mr-1.5 flex h-2 w-2 rounded-full bg-emerald-400"></span>
            System Live
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="flex items-center gap-2 pb-4 border-b border-border">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-bold text-foreground">Critical Overdue Returns</h3>
            </div>
            <div className="mt-4 divide-y divide-border">
              {overdueItems.length > 0 ? (
                overdueItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/15">
                          {item.tag}
                        </span>
                        <span className="font-semibold text-sm text-foreground">{item.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Held by <span className="font-medium text-foreground">{item.holder}</span> · Due since {item.dueDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive/10">
                        {item.daysOverdue} days late
                      </span>
                    </div>
                  </div>
                ))
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
              <Link href="/assets" className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted hover:bg-primary/5 border border-border hover:border-primary/30 transition-all text-center group cursor-pointer">
                <PlusCircle className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm text-foreground">Register Asset</span>
                <span className="text-3xs text-muted-foreground mt-1">Add new equipment catalog</span>
              </Link>
              <Link href="/bookings" className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted hover:bg-secondary/5 border border-border hover:border-secondary/30 transition-all text-center group cursor-pointer">
                <CalendarDays className="h-6 w-6 text-secondary mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm text-foreground">Book Resource</span>
                <span className="text-3xs text-muted-foreground mt-1">Reserve office spaces or cars</span>
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
                        <p className="text-sm font-semibold text-foreground">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.detail}
                        </p>
                        <span className="inline-block text-3xs text-muted-foreground mt-1">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
