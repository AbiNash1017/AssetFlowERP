"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireRole, requireSession } from "@/lib/rbac-server";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";
import { auditCycleSchema, auditEntrySchema } from "@/lib/validations/audit";

export async function createAuditCycle(formData: FormData) {
  const session = await requireRole(["ASSET_MANAGER", "ADMIN"]);

  const raw = {
    name: formData.get("name") as string,
    scope: formData.get("scope") as "DEPARTMENT" | "LOCATION",
    scopeId: formData.get("scopeId") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    auditorIds: formData.getAll("auditorIds") as string[],
  };

  const parsed = auditCycleSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, scope, scopeId, startDate, endDate, auditorIds } = parsed.data;

  try {
    const cycle = await db.$transaction(async (tx) => {
      // Create cycle
      const newCycle = await tx.auditCycle.create({
        data: {
          name,
          scope,
          scopeId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: "ACTIVE",
          createdById: session.user.id,
        },
      });

      // Create assignments
      await tx.auditAssignment.createMany({
        data: auditorIds.map((auditorId) => ({
          cycleId: newCycle.id,
          auditorId,
        })),
      });

      return newCycle;
    });

    // Log Activity
    await logActivity({
      userId: session.user.id,
      action: "CREATE_AUDIT_CYCLE",
      entityType: "AuditCycle",
      entityId: cycle.id,
      metadata: { name, scope, scopeId },
    });

    // Notify assigned auditors
    for (const auditorId of auditorIds) {
      await createNotification({
        userId: auditorId,
        type: "AUDIT_ASSIGNED",
        title: "New Audit Cycle Assigned",
        message: `You have been assigned as an auditor for the cycle "${name}".`,
        entityType: "AuditCycle",
        entityId: cycle.id,
      });
    }

    revalidatePath("/audit");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to create audit cycle" };
  }
}

export async function recordAuditEntry(formData: FormData) {
  const session = await requireSession();
  const userRole = session.user.role || "EMPLOYEE";

  const raw = {
    cycleId: formData.get("cycleId") as string,
    assetId: formData.get("assetId") as string,
    result: formData.get("result") as "VERIFIED" | "MISSING" | "DAMAGED",
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = auditEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { cycleId, assetId, result, notes } = parsed.data;

  try {
    const cycle = await db.auditCycle.findUnique({
      where: { id: cycleId },
      include: { assignments: true },
    });

    if (!cycle) {
      return { error: "Audit cycle not found" };
    }

    if (cycle.status === "CLOSED") {
      return { error: "This audit cycle has been closed and locked." };
    }

    // Permission check: Assigned auditor or Asset Manager or Admin
    const isAssigned = cycle.assignments.some((a) => a.auditorId === session.user.id);
    const isManager = ["ASSET_MANAGER", "ADMIN"].includes(userRole);

    if (!isAssigned && !isManager) {
      return { error: "FORBIDDEN: You are not assigned to perform audits in this cycle." };
    }

    const entry = await db.$transaction(async (tx) => {
      // Find asset
      const asset = await tx.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw new Error("Asset not found");

      // Check if entry already exists
      const existingEntry = await tx.auditEntry.findFirst({
        where: { cycleId, assetId },
      });

      let auditEntry;
      if (existingEntry) {
        auditEntry = await tx.auditEntry.update({
          where: { id: existingEntry.id },
          data: {
            auditorId: session.user.id,
            result,
            notes: notes || null,
          },
        });
      } else {
        auditEntry = await tx.auditEntry.create({
          data: {
            cycleId,
            assetId,
            auditorId: session.user.id,
            result,
            notes: notes || null,
          },
        });
      }

      // If marked damaged, we can also update asset condition in-place
      if (result === "DAMAGED" && notes) {
        await tx.asset.update({
          where: { id: assetId },
          data: { condition: notes },
        });
      }

      return { auditEntry, assetName: asset.name, assetTag: asset.assetTag };
    });

    // Log Activity
    await logActivity({
      userId: session.user.id,
      action: "RECORD_AUDIT_ENTRY",
      entityType: "AuditEntry",
      entityId: entry.auditEntry.id,
      metadata: { cycleId, assetId, result },
    });

    // Discrepancy flagging: notify managers/admins if missing or damaged
    if (result !== "VERIFIED") {
      const managers = await db.user.findMany({
        where: {
          role: { in: ["ASSET_MANAGER", "ADMIN"] },
          status: "ACTIVE",
        },
      });

      for (const manager of managers) {
        await createNotification({
          userId: manager.id,
          type: "AUDIT_DISCREPANCY",
          title: "Audit Discrepancy Flagged",
          message: `Asset "${entry.assetName}" (${entry.assetTag}) was audited as ${result.toLowerCase()} in "${cycle.name}" by ${session.user.name}.`,
          entityType: "AuditEntry",
          entityId: entry.auditEntry.id,
        });
      }
    }

    revalidatePath("/audit");
    revalidatePath(`/audit/${cycleId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to record audit entry" };
  }
}

export async function closeAuditCycle(cycleId: string) {
  const session = await requireRole(["ASSET_MANAGER", "ADMIN"]);

  try {
    const cycle = await db.auditCycle.findUnique({
      where: { id: cycleId },
    });

    if (!cycle) {
      return { error: "Audit cycle not found" };
    }

    if (cycle.status === "CLOSED") {
      return { error: "Audit cycle is already closed." };
    }

    await db.$transaction(async (tx) => {
      // 1. Mark cycle as CLOSED
      await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: "CLOSED" },
      });

      // 2. Fetch all MISSING audit entries for this cycle
      const missingEntries = await tx.auditEntry.findMany({
        where: {
          cycleId,
          result: "MISSING",
        },
      });

      // 3. Update the status of missing assets to LOST
      const missingAssetIds = missingEntries.map((e) => e.assetId);
      if (missingAssetIds.length > 0) {
        await tx.asset.updateMany({
          where: {
            id: { in: missingAssetIds },
          },
          data: {
            status: "LOST",
          },
        });
      }
    });

    // Log Activity
    await logActivity({
      userId: session.user.id,
      action: "CLOSE_AUDIT_CYCLE",
      entityType: "AuditCycle",
      entityId: cycleId,
    });

    revalidatePath("/audit");
    revalidatePath(`/audit/${cycleId}`);
    revalidatePath("/assets");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to close audit cycle" };
  }
}
