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

  // Convert dates to ISO strings to pass from Server to Client component safely
  const serializedBookings = bookings.map((b) => ({
    ...b,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
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
