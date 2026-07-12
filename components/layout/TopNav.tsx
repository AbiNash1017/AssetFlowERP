"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import useUIStore from "@/store/useUIStore";
import useNotificationStore from "@/store/useNotificationStore";
import { Bell, Menu, LogOut, User as UserIcon, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface TopNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function TopNav({ user }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully.");
      router.push("/login");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign out.";
      toast.error(msg);
    }
  };

  // Convert pathname to dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ label: "Dashboard", href: "/" }];

    return [
      { label: "Dashboard", href: "/" },
      ...segments.map((seg, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace("-", " ");
        return { label, href };
      }),
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6 lg:px-8">
      {/* Left side: Sidebar Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="hidden sm:flex" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            {breadcrumbs.map((crumb, idx) => (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-border">/</span>}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-foreground font-semibold">{crumb.label}</span>
                ) : (
                  <a href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Right side: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary"></span>
            </span>
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20 hover:bg-primary/25 transition-all">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay for closing dropdown */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)}
              />

              <div className="absolute right-0 mt-2.5 z-20 w-48 origin-top-right rounded-md border border-border bg-card p-1 shadow-lg focus:outline-none">
                <div className="px-3 py-2 text-xs border-b border-border text-muted-foreground mb-1">
                  <span className="font-semibold block text-foreground truncate">{user.name}</span>
                  <span className="truncate block mt-0.5">{user.email}</span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
