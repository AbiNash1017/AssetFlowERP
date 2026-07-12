import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/rbac-server";
import SettingsClient from "@/components/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect("/login");
  }

  const currentUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image || null,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <SettingsClient currentUser={currentUser} />
    </div>
  );
}
