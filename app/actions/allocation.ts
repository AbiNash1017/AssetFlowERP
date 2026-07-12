"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireRole, requireSession } from "@/lib/rbac-server";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";
import { allocationSchema, returnAssetSchema, transferRequestSchema } from "@/lib/validations/allocation";

export async function allocateAsset(formData: FormData) {
  const session = await requireRole(["ASSET_MANAGER", "ADMIN"]);

  const raw = {
    assetId: formData.get("assetId") as string,
    userId: (formData.get("userId") as string) || undefined,
    departmentId: (formData.get("departmentId") as string) || undefined,
    expectedReturnDate: (formData.get("expectedReturnDate") as string) || undefined,
  };

  const parsed = allocationSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { assetId, userId, departmentId, expectedReturnDate } = parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Double-allocation check: check asset status inside a transaction to prevent race conditions
      const asset = await tx.asset.findUnique({
        where: { id: assetId },
      });

      if (!asset) {
        throw new Error("Asset not found");
      }

      if (asset.status !== "AVAILABLE") {
        // Find current holder details to show "held by [Name]"
        const currentAlloc = await tx.allocation.findFirst({
          where: { assetId, status: "ACTIVE" },
          include: { user: true, department: true },
        });
        const holderName = currentAlloc?.user?.name || currentAlloc?.department?.name || "another user";
        throw new Error(`Double-allocation blocked: Asset is currently held by ${holderName}`);
      }

      // 2. Create allocation
      const allocation = await tx.allocation.create({
        data: {
          assetId,
          userId: userId || null,
          departmentId: departmentId || null,
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          status: "ACTIVE",
        },
      });

      // 3. Update asset status
      await tx.asset.update({
        where: { id: assetId },
        data: { status: "ALLOCATED" },
      });

      return allocation;
    });

    // Log Activity & Create Notification
    await logActivity({
      userId: session.user.id,
      action: "ALLOCATE_ASSET",
      entityType: "Asset",
      entityId: assetId,
      metadata: { userId, departmentId, expectedReturnDate },
    });

    if (userId) {
      await createNotification({
        userId,
        type: "ALLOCATION",
        title: "Asset Allocated to You",
        message: `You have been allocated a new asset. Expected return: ${
          expectedReturnDate ? new Date(expectedReturnDate).toLocaleDateString() : "Indefinite"
        }.`,
        entityType: "Asset",
        entityId: assetId,
      });
    }

    revalidatePath("/assets");
    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/allocation");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to allocate asset" };
  }
}

export async function returnAsset(formData: FormData) {
  const session = await requireRole(["ASSET_MANAGER", "ADMIN"]);

  const raw = {
    allocationId: formData.get("allocationId") as string,
    conditionNotes: (formData.get("conditionNotes") as string) || undefined,
  };

  const parsed = returnAssetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { allocationId, conditionNotes } = parsed.data;

  try {
    const allocation = await db.allocation.findUnique({
      where: { id: allocationId },
      include: { asset: true },
    });

    if (!allocation) {
      return { error: "Allocation record not found" };
    }

    await db.$transaction(async (tx) => {
      // 1. Update allocation record
      await tx.allocation.update({
        where: { id: allocationId },
        data: {
          status: "RETURNED",
          returnedAt: new Date(),
          conditionNotes: conditionNotes || null,
        },
      });

      // 2. Set asset back to AVAILABLE
      await tx.asset.update({
        where: { id: allocation.assetId },
        data: {
          status: "AVAILABLE",
          condition: conditionNotes || allocation.asset.condition, // Update condition if specified
        },
      });
    });

    await logActivity({
      userId: session.user.id,
      action: "RETURN_ASSET",
      entityType: "Asset",
      entityId: allocation.assetId,
      metadata: { allocationId },
    });

    if (allocation.userId) {
      await createNotification({
        userId: allocation.userId,
        type: "RETURN",
        title: "Asset Return Checked In",
        message: `Your returned asset ${allocation.asset.assetTag} has been checked in successfully.`,
        entityType: "Asset",
        entityId: allocation.assetId,
      });
    }

    revalidatePath("/assets");
    revalidatePath(`/assets/${allocation.assetId}`);
    revalidatePath("/allocation");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to process asset return" };
  }
}

export async function createTransferRequest(formData: FormData) {
  const session = await requireSession();

  const raw = {
    assetId: formData.get("assetId") as string,
    toUserId: formData.get("toUserId") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = transferRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { assetId, toUserId, notes } = parsed.data;

  try {
    // Check for active allocation of this asset
    const activeAlloc = await db.allocation.findFirst({
      where: { assetId, status: "ACTIVE" },
    });

    if (!activeAlloc || !activeAlloc.userId) {
      return { error: "Asset is not currently allocated to an individual employee." };
    }

    const transferRequest = await db.transferRequest.create({
      data: {
        assetId,
        fromUserId: activeAlloc.userId,
        toUserId,
        requestedById: session.user.id,
        notes: notes || null,
        status: "PENDING",
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "CREATE_TRANSFER_REQUEST",
      entityType: "TransferRequest",
      entityId: transferRequest.id,
    });

    // Notify target user
    await createNotification({
      userId: toUserId,
      type: "TRANSFER_REQUEST",
      title: "Asset Transfer Proposed",
      message: `An asset transfer request has been proposed to you. Check your allocations to review.`,
      entityType: "TransferRequest",
      entityId: transferRequest.id,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/allocation");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to initiate transfer request" };
  }
}

export async function approveTransferRequest(requestId: string, notes?: string) {
  const session = await requireSession();
  const userRole = session.user.role || "EMPLOYEE";

  try {
    const request = await db.transferRequest.findUnique({
      where: { id: requestId },
      include: { asset: true },
    });

    if (!request) {
      return { error: "Transfer request not found" };
    }

    // Role-check: Dept Head of either user's department, Asset Manager, or Admin
    const targetUser = await db.user.findUnique({ where: { id: request.toUserId } });
    const fromUser = await db.user.findUnique({ where: { id: request.fromUserId } });

    const isAuthorized = 
      userRole === "ADMIN" || 
      userRole === "ASSET_MANAGER" || 
      (userRole === "DEPARTMENT_HEAD" && 
        ((session.user.departmentId && session.user.departmentId === targetUser?.departmentId) || 
         (session.user.departmentId && session.user.departmentId === fromUser?.departmentId)));

    if (!isAuthorized) {
      return { error: "FORBIDDEN: Insufficient permissions to approve this transfer." };
    }

    await db.$transaction(async (tx) => {
      // 1. Mark transfer request approved
      await tx.transferRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          approvedById: session.user.id,
          notes: notes || request.notes,
        },
      });

      // 2. Return previous active allocation
      const activeAlloc = await tx.allocation.findFirst({
        where: { assetId: request.assetId, status: "ACTIVE" },
      });

      if (activeAlloc) {
        await tx.allocation.update({
          where: { id: activeAlloc.id },
          data: {
            status: "RETURNED",
            returnedAt: new Date(),
            conditionNotes: `Transferred to ${targetUser?.name || "Target User"}`,
          },
        });
      }

      // 3. Create new allocation
      await tx.allocation.create({
        data: {
          assetId: request.assetId,
          userId: request.toUserId,
          status: "ACTIVE",
          allocatedAt: new Date(),
        },
      });
    });

    await logActivity({
      userId: session.user.id,
      action: "APPROVE_TRANSFER_REQUEST",
      entityType: "TransferRequest",
      entityId: requestId,
    });

    // Notify all involved parties
    await createNotification({
      userId: request.toUserId,
      type: "TRANSFER_APPROVED",
      title: "Asset Transfer Approved",
      message: `The transfer of asset ${request.asset.assetTag} has been approved. You are now the active holder.`,
      entityType: "Asset",
      entityId: request.assetId,
    });

    await createNotification({
      userId: request.fromUserId,
      type: "TRANSFER_APPROVED",
      title: "Asset Transferred Out",
      message: `The asset ${request.asset.assetTag} has been successfully transferred to ${targetUser?.name || "Recipient"}.`,
      entityType: "Asset",
      entityId: request.assetId,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${request.assetId}`);
    revalidatePath("/allocation");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to approve transfer request" };
  }
}

export async function rejectTransferRequest(requestId: string, notes?: string) {
  const session = await requireSession();
  const userRole = session.user.role || "EMPLOYEE";

  try {
    const request = await db.transferRequest.findUnique({
      where: { id: requestId },
      include: { asset: true },
    });

    if (!request) {
      return { error: "Transfer request not found" };
    }

    const targetUser = await db.user.findUnique({ where: { id: request.toUserId } });
    const fromUser = await db.user.findUnique({ where: { id: request.fromUserId } });

    const isAuthorized = 
      userRole === "ADMIN" || 
      userRole === "ASSET_MANAGER" || 
      (userRole === "DEPARTMENT_HEAD" && 
        ((session.user.departmentId && session.user.departmentId === targetUser?.departmentId) || 
         (session.user.departmentId && session.user.departmentId === fromUser?.departmentId)));

    if (!isAuthorized) {
      return { error: "FORBIDDEN: Insufficient permissions to reject this transfer." };
    }

    await db.transferRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        notes: notes || null,
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "REJECT_TRANSFER_REQUEST",
      entityType: "TransferRequest",
      entityId: requestId,
    });

    // Notify requester
    await createNotification({
      userId: request.requestedById,
      type: "TRANSFER_REJECTED",
      title: "Asset Transfer Rejected",
      message: `The proposed transfer of asset ${request.asset.assetTag} was rejected.`,
      entityType: "Asset",
      entityId: request.assetId,
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${request.assetId}`);
    revalidatePath("/allocation");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to reject transfer request" };
  }
}
