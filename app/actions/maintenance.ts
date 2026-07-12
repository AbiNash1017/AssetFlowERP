"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireRole, requireSession } from "@/lib/rbac-server";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";
import { maintenanceRequestSchema, resolveMaintenanceSchema } from "@/lib/validations/maintenance";
import { Role } from "@prisma/client";

export async function createMaintenanceRequest(formData: FormData) {
  const session = await requireSession();

  const raw = {
    assetId: formData.get("assetId") as string,
    issue: formData.get("issue") as string,
    priority: formData.get("priority") as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    photoUrl: (formData.get("photoUrl") as string) || undefined,
  };

  const parsed = maintenanceRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { assetId, issue, priority, photoUrl } = parsed.data;

  try {
    const request = await db.maintenanceRequest.create({
      data: {
        assetId,
        raisedById: session.user.id,
        issue,
        priority,
        photoUrl: photoUrl || null,
        status: "PENDING",
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "RAISE_MAINTENANCE",
      entityType: "MaintenanceRequest",
      entityId: request.id,
    });

    // Notify asset managers
    const managers = await db.user.findMany({
      where: {
        role: { in: ["ASSET_MANAGER", "ADMIN"] },
        status: "ACTIVE",
      },
    });

    for (const manager of managers) {
      await createNotification({
        userId: manager.id,
        type: "MAINTENANCE_RAISED",
        title: "New Maintenance Request",
        message: `A new ${priority.toLowerCase()} priority maintenance request was raised.`,
        entityType: "MaintenanceRequest",
        entityId: request.id,
      });
    }

    revalidatePath("/assets");
    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/maintenance");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to submit maintenance request" };
  }
}

export async function approveMaintenanceRequest(id: string) {
  const session = await requireRole(["ASSET_MANAGER", "ADMIN"]);

  try {
    const request = await db.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!request) {
      return { error: "Maintenance request not found" };
    }

    await db.$transaction(async (tx) => {
      // 1. Approve the request
      await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById: session.user.id,
        },
      });

      // 2. Set asset status to UNDER_MAINTENANCE
      await tx.asset.update({
        where: { id: request.assetId },
        data: { status: "UNDER_MAINTENANCE" },
      });
    });

    await logActivity({
      userId: session.user.id,
      action: "APPROVE_MAINTENANCE",
      entityType: "MaintenanceRequest",
      entityId: id,
    });

    // Notify the user who raised it
    await createNotification({
      userId: request.raisedById,
      type: "MAINTENANCE_APPROVED",
      title: "Maintenance Request Approved",
      message: `Your maintenance request for asset ${request.asset.assetTag} has been approved and moved to repair.`,
      entityType: "Asset",
      entityId: request.assetId,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${request.assetId}`);
    revalidatePath("/maintenance");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to approve maintenance request" };
  }
}

export async function rejectMaintenanceRequest(id: string) {
  const session = await requireRole(["ASSET_MANAGER", "ADMIN"]);

  try {
    const request = await db.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!request) {
      return { error: "Maintenance request not found" };
    }

    await db.maintenanceRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    await logActivity({
      userId: session.user.id,
      action: "REJECT_MAINTENANCE",
      entityType: "MaintenanceRequest",
      entityId: id,
    });

    // Notify user
    await createNotification({
      userId: request.raisedById,
      type: "MAINTENANCE_REJECTED",
      title: "Maintenance Request Rejected",
      message: `Your maintenance request for asset ${request.asset.assetTag} was rejected.`,
      entityType: "Asset",
      entityId: request.assetId,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${request.assetId}`);
    revalidatePath("/maintenance");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reject maintenance request" };
  }
}

export async function assignTechnician(id: string, technicianId: string) {
  const session = await requireRole(["ASSET_MANAGER", "ADMIN"]);

  try {
    await db.maintenanceRequest.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        technicianId,
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "ASSIGN_TECHNICIAN",
      entityType: "MaintenanceRequest",
      entityId: id,
      metadata: { technicianId },
    });

    // Notify technician
    await createNotification({
      userId: technicianId,
      type: "MAINTENANCE_ASSIGNED",
      title: "Maintenance Assigned to You",
      message: `You have been assigned to resolve a maintenance request.`,
      entityType: "MaintenanceRequest",
      entityId: id,
    });

    revalidatePath("/maintenance");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to assign technician" };
  }
}

export async function resolveMaintenanceRequest(id: string, resolutionNotes?: string) {
  const session = await requireSession();
  const userRole = session.user.role || "EMPLOYEE";

  try {
    const request = await db.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!request) {
      return { error: "Maintenance request not found" };
    }

    // Role-check: Asset Manager, Admin, or the assigned technician
    const isAuthorized = 
      userRole === "ADMIN" || 
      userRole === "ASSET_MANAGER" || 
      request.technicianId === session.user.id;

    if (!isAuthorized) {
      return { error: "FORBIDDEN: Insufficient permissions to resolve this request." };
    }

    await db.$transaction(async (tx) => {
      // 1. Resolve request
      await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
        },
      });

      // 2. Return asset status to AVAILABLE, updating condition if noted
      await tx.asset.update({
        where: { id: request.assetId },
        data: {
          status: "AVAILABLE",
          condition: resolutionNotes || request.asset.condition,
        },
      });
    });

    await logActivity({
      userId: session.user.id,
      action: "RESOLVE_MAINTENANCE",
      entityType: "MaintenanceRequest",
      entityId: id,
    });

    // Notify the user who raised it
    await createNotification({
      userId: request.raisedById,
      type: "MAINTENANCE_RESOLVED",
      title: "Asset Maintenance Resolved",
      message: `The maintenance issue reported for asset ${request.asset.assetTag} has been resolved.`,
      entityType: "Asset",
      entityId: request.assetId,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${request.assetId}`);
    revalidatePath("/maintenance");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to resolve maintenance request" };
  }
}
