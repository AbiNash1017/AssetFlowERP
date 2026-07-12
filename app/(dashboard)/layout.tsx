import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/rbac-server";
import Sidebar from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch or map extra user parameters
  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role || "EMPLOYEE",
    image: session.user.image,
    departmentId: session.user.departmentId,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - role-aware navigation */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <TopNav user={user} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto focus:outline-none bg-background/50">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
