"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useUIStore from "@/store/useUIStore";
import { ROLE_LABELS } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { 
  LayoutDashboard, 
  Settings, 
  Package, 
  FolderSync, 
  CalendarDays, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  History, 
  ShieldCheck, 
  X,
  Menu
} from "lucide-react";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const userRole = user.role as Role;

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, show: true },
    { 
      name: "Organization setup", 
      href: "/organization", 
      icon: Settings, 
      show: true 
    },
    { 
      name: "Assets", 
      href: "/assets", 
      icon: Package, 
      show: true 
    },
    { 
      name: "Allocation & Transfer", 
      href: "/allocation", 
      icon: FolderSync, 
      show: true 
    },
    { 
      name: "Resource Booking", 
      href: "/bookings", 
      icon: CalendarDays, 
      show: true 
    },
    { 
      name: "Maintenance", 
      href: "/maintenance", 
      icon: Wrench, 
      show: true 
    },
    { 
      name: "Audit", 
      href: "/audit", 
      icon: ClipboardCheck, 
      show: true 
    },
    { 
      name: "Reports", 
      href: "/reports", 
      icon: BarChart3, 
      show: true 
    },
    { 
      name: "Notifications", 
      href: "/notifications", 
      icon: History, 
      show: true 
    },
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ShieldCheck className="h-5 w-5 text-secondary" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">AssetFlow</span>
          </Link>
          <button 
            onClick={toggleSidebar} 
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold truncate text-foreground">{user.name}</h4>
              <span className="inline-flex items-center rounded-full bg-secondary/15 px-2 py-0.5 text-3xs font-medium text-secondary border border-secondary/10 mt-0.5">
                {ROLE_LABELS[userRole]}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation
            .filter((item) => item.show)
            .map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  }`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-muted/20 text-3xs text-center text-muted-foreground">
          ERP Resource Manager v1.0
        </div>
      </aside>
    </>
  );
}
