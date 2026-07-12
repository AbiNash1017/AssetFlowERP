import React from "react";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getServerSession } from "@/lib/rbac-server";
import NewBookingForm from "@/components/bookings/NewBookingForm";

export default async function NewBookingPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch all bookable assets
  const bookableAssets = await db.asset.findMany({
    where: {
      isBookable: true,
      status: {
        notIn: ["RETIRED", "DISPOSED"],
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch all active bookings to display inside overlap helper on the form
  const bookings = await db.booking.findMany({
    where: {
      status: {
        in: ["UPCOMING", "ONGOING"],
      },
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Serialize models for client
  const serializedAssets = bookableAssets.map((a) => ({
    ...a,
    acquisitionCost: a.acquisitionCost.toString(),
    acquisitionDate: a.acquisitionDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const serializedBookings = bookings.map((b) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <NewBookingForm 
        bookableAssets={serializedAssets} 
        initialBookings={serializedBookings} 
      />
    </div>
  );
}
