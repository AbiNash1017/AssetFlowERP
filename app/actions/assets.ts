"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireRole } from "@/lib/rbac-server";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";
import { assetSchema } from "@/lib/validations/asset";

/** Auto-generates the next AF-XXXX tag */
async function generateAssetTag(): Promise<string> {
  const count = await db.asset.count();
  const next = count + 1;
  return `AF-${String(next).padStart(4, "0")}`;
}

export async function registerAsset(formData: FormData) {
  const session = await requireRole(["ASSET_MANAGER", "ADMIN"]);

  const raw = {
    name: formData.get("name") as string,
    categoryId: formData.get("categoryId") as string,
    serialNumber: formData.get("serialNumber") as string,
    acquisitionDate: formData.get("acquisitionDate") as string,
    acquisitionCost: parseFloat(formData.get("acquisitionCost") as string),
    condition: formData.get("condition") as string,
    location: formData.get("location") as string,
    isBookable: formData.get("isBookable") === "true",
    photoUrl: (formData.get("photoUrl") as string) || undefined,
  };

  const parsed = assetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const documentsRaw = formData.get("documents") as string;
  let documentsObj = null;
  if (documentsRaw) {
    try {
      documentsObj = JSON.parse(documentsRaw);
    } catch (e) {
      return { error: "Invalid JSON for custom asset fields" };
    }
  }

  const assetTag = await generateAssetTag();

  const asset = await db.asset.create({
    data: {
      ...parsed.data,
      assetTag,
      acquisitionDate: new Date(parsed.data.acquisitionDate),
      acquisitionCost: parsed.data.acquisitionCost,
      documents: documentsObj,
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "REGISTER_ASSET",
    entityType: "Asset",
    entityId: asset.id,
    metadata: { assetTag, name: asset.name },
  });

  revalidatePath("/assets");
  return { success: true, id: asset.id, assetTag };
}

export async function updateAsset(id: string, formData: FormData) {
  const session = await requireRole(["ASSET_MANAGER", "ADMIN"]);

  const raw = {
    name: formData.get("name") as string,
    categoryId: formData.get("categoryId") as string,
    serialNumber: formData.get("serialNumber") as string,
    acquisitionDate: formData.get("acquisitionDate") as string,
    acquisitionCost: parseFloat(formData.get("acquisitionCost") as string),
    condition: formData.get("condition") as string,
    location: formData.get("location") as string,
    isBookable: formData.get("isBookable") === "true",
    photoUrl: (formData.get("photoUrl") as string) || undefined,
  };

  const parsed = assetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const documentsRaw = formData.get("documents") as string;
  let documentsObj = null;
  if (documentsRaw) {
    try {
      documentsObj = JSON.parse(documentsRaw);
    } catch (e) {
      return { error: "Invalid JSON for custom asset fields" };
    }
  }

  await db.asset.update({
    where: { id },
    data: {
      ...parsed.data,
      acquisitionDate: new Date(parsed.data.acquisitionDate),
      documents: documentsObj,
    },
  });

  await logActivity({
    userId: session.user.id,
    action: "UPDATE_ASSET",
    entityType: "Asset",
    entityId: id,
  });

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  return { success: true };
}

export async function updateAssetStatus(id: string, status: string) {
  try {
    const session = await requireRole(["ASSET_MANAGER", "ADMIN"]);

    await db.asset.update({ where: { id }, data: { status: status as any } });

    await logActivity({
      userId: session.user.id,
      action: "UPDATE_ASSET_STATUS",
      entityType: "Asset",
      entityId: id,
      metadata: { newStatus: status },
    });

    revalidatePath("/assets");
    revalidatePath(`/assets/${id}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update asset status" };
  }
}
