"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireSession } from "@/lib/rbac-server";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";
import { bookingSchema } from "@/lib/validations/booking";
import { Role } from "@prisma/client";

export async function createBooking(formData: FormData) {
  const session = await requireSession();

  const raw = {
    assetId: formData.get("assetId") as string,
    title: formData.get("title") as string,
    startTime: formData.get("startTime") as string,
    endTime: formData.get("endTime") as string,
  };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { assetId, title, startTime, endTime } = parsed.data;
  const start = new Date(startTime);
  const end = new Date(endTime);

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Check if asset exists and is bookable
      const asset = await tx.asset.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        throw new Error("Asset not found");
      }

      if (!asset.isBookable) {
        throw new Error("This asset is not marked as bookable.");
      }

      if (asset.status === "RETIRED" || asset.status === "DISPOSED") {
        throw new Error(`This asset is retired or disposed and cannot be booked.`);
      }

      // 2. Check for overlaps (active bookings where startTime < existingEnd AND endTime > existingStart)
      const overlaps = await tx.booking.findMany({
        where: {
          assetId,
          status: { in: ["UPCOMING", "ONGOING"] },
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
        include: { user: true },
      });

      if (overlaps.length > 0) {
        const firstOver = overlaps[0];
        throw new Error(
          `Time conflict: Asset is already booked by ${firstOver.user.name} for "${firstOver.title}" (${new Date(
            firstOver.startTime
          ).toLocaleTimeString()} - ${new Date(firstOver.endTime).toLocaleTimeString()})`
        );
      }

      // 3. Create the booking
      const booking = await tx.booking.create({
        data: {
          assetId,
          userId: session.user.id,
          title,
          startTime: start,
          endTime: end,
          status: "UPCOMING",
        },
      });

      return { booking, assetName: asset.name };
    });

    const { booking, assetName } = result;

    // Log Activity
    await logActivity({
      userId: session.user.id,
      action: "BOOK_RESOURCE",
      entityType: "Booking",
      entityId: booking.id,
      metadata: { assetId, title, startTime, endTime },
    });

    // Create Notification
    await createNotification({
      userId: session.user.id,
      type: "BOOKING_CONFIRMED",
      title: "Booking Confirmed",
      message: `You successfully booked "${assetName}" for "${title}".`,
      entityType: "Booking",
      entityId: booking.id,
    });

    revalidatePath("/bookings");
    revalidatePath("/assets");
    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create booking" };
  }
}

export async function cancelBooking(id: string) {
  const session = await requireSession();
  const userRole = session.user.role || "EMPLOYEE";

  try {
    const booking = await db.booking.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!booking) {
      return { error: "Booking not found" };
    }

    // Auth check: Own booking or Asset Manager/Admin
    const isOwner = booking.userId === session.user.id;
    const isManager = ["ASSET_MANAGER", "ADMIN"].includes(userRole);

    if (!isOwner && !isManager) {
      return { error: "FORBIDDEN: Insufficient permissions to cancel this booking." };
    }

    await db.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Log Activity
    await logActivity({
      userId: session.user.id,
      action: "CANCEL_BOOKING",
      entityType: "Booking",
      entityId: id,
    });

    // Notify the user who booked it (if cancelled by manager/admin)
    if (!isOwner) {
      await createNotification({
        userId: booking.userId,
        type: "BOOKING_CANCELLED",
        title: "Booking Cancelled by Admin",
        message: `Your booking for "${booking.asset.name}" has been cancelled.`,
        entityType: "Booking",
        entityId: id,
      });
    } else {
      await createNotification({
        userId: booking.userId,
        type: "BOOKING_CANCELLED",
        title: "Booking Cancelled",
        message: `You cancelled your booking for "${booking.asset.name}".`,
        entityType: "Booking",
        entityId: id,
      });
    }

    revalidatePath("/bookings");
    revalidatePath("/assets");
    revalidatePath(`/assets/${booking.assetId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to cancel booking" };
  }
}

export async function rescheduleBooking(id: string, startTime: string, endTime: string) {
  const session = await requireSession();
  const userRole = session.user.role || "EMPLOYEE";

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    return { error: "End time must be after start time" };
  }

  try {
    const booking = await db.booking.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!booking) {
      return { error: "Booking not found" };
    }

    // Auth check: Own booking or Asset Manager/Admin
    const isOwner = booking.userId === session.user.id;
    const isManager = ["ASSET_MANAGER", "ADMIN"].includes(userRole);

    if (!isOwner && !isManager) {
      return { error: "FORBIDDEN: Insufficient permissions to reschedule this booking." };
    }

    // Check for overlaps with other bookings (excluding the current booking itself)
    const overlaps = await db.booking.findMany({
      where: {
        assetId: booking.assetId,
        id: { not: id },
        status: { in: ["UPCOMING", "ONGOING"] },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } },
        ],
      },
      include: { user: true },
    });

    if (overlaps.length > 0) {
      const firstOver = overlaps[0];
      return {
        error: `Time conflict: Asset is already booked by ${firstOver.user.name} for "${firstOver.title}" (${new Date(
          firstOver.startTime
        ).toLocaleTimeString()} - ${new Date(firstOver.endTime).toLocaleTimeString()})`,
      };
    }

    await db.booking.update({
      where: { id },
      data: {
        startTime: start,
        endTime: end,
        status: "UPCOMING", // reset to upcoming if rescheduled
      },
    });

    // Log Activity
    await logActivity({
      userId: session.user.id,
      action: "RESCHEDULE_BOOKING",
      entityType: "Booking",
      entityId: id,
      metadata: { startTime, endTime },
    });

    // Notify user
    await createNotification({
      userId: booking.userId,
      type: "BOOKING_RESCHEDULED",
      title: "Booking Rescheduled",
      message: `Your booking for "${booking.asset.name}" has been rescheduled.`,
      entityType: "Booking",
      entityId: id,
    });

    revalidatePath("/bookings");
    revalidatePath("/assets");
    revalidatePath(`/assets/${booking.assetId}`);
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reschedule booking" };
  }
}
