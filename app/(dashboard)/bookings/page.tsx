import React from "react";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { getServerSession } from "@/lib/rbac-server";
import BookingsClient from "@/components/bookings/BookingsClient";

export default async function BookingsPage() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch all bookings with asset and user relations
  const bookings = await db.booking.findMany({
    include: {
      asset: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
    orderBy: {
      startTime: "desc",
    },
  });

  // Fetch bookable assets to populate filter/creation forms
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

  // Convert dates and nested assets to ISO strings/standard types to pass safely
  const serializedBookings = bookings.map((b) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    asset: b.asset ? {
      ...b.asset,
      acquisitionCost: b.asset.acquisitionCost.toString(),
      acquisitionDate: b.asset.acquisitionDate.toISOString(),
      createdAt: b.asset.createdAt.toISOString(),
      updatedAt: b.asset.updatedAt.toISOString(),
    } : null,
  }));

  const serializedAssets = bookableAssets.map((a) => ({
    ...a,
    acquisitionDate: a.acquisitionDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    acquisitionCost: a.acquisitionCost.toString(),
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BookingsClient 
        initialBookings={serializedBookings} 
        bookableAssets={serializedAssets} 
        currentUser={session.user} 
      />
    </div>
  );
}
