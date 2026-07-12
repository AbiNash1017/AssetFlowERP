"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { requireRole } from "@/lib/rbac-server";
import { logActivity } from "@/lib/activity-log";
import {
  departmentSchema,
  categorySchema,
  employeeRoleSchema,
  employeeStatusSchema,
} from "@/lib/validations/organization";
import { createNotification } from "@/lib/notifications";

// ─── DEPARTMENT ──────────────────────────────────────────────────────────────

export async function createDepartment(formData: FormData) {
  const session = await requireRole(["ADMIN"]);

  const raw = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    headId: (formData.get("headId") as string) || undefined,
    parentDepartmentId: (formData.get("parentDepartmentId") as string) || undefined,
    status: (formData.get("status") as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
  };

  const parsed = departmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const dept = await db.department.create({
    data: {
      ...parsed.data,
      headId: parsed.data.headId || null,
      parentDepartmentId: parsed.data.parentDepartmentId || null,
    },
  });
  await logActivity({
    userId: session.user.id,
    action: "CREATE_DEPARTMENT",
    entityType: "Department",
    entityId: dept.id,
    metadata: { name: dept.name },
  });
  revalidatePath("/organization");
  return { success: true, id: dept.id };
}

export async function updateDepartment(id: string, formData: FormData) {
  const session = await requireRole(["ADMIN"]);

  const raw = {
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    headId: (formData.get("headId") as string) || undefined,
    parentDepartmentId: (formData.get("parentDepartmentId") as string) || undefined,
    status: (formData.get("status") as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
  };

  const parsed = departmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.department.update({
    where: { id },
    data: {
      ...parsed.data,
      headId: parsed.data.headId || null,
      parentDepartmentId: parsed.data.parentDepartmentId || null,
    },
  });
  await logActivity({
    userId: session.user.id,
    action: "UPDATE_DEPARTMENT",
    entityType: "Department",
    entityId: id,
  });
  revalidatePath("/organization");
  return { success: true };
}

export async function deactivateDepartment(id: string) {
  try {
    const session = await requireRole(["ADMIN"]);
    await db.department.update({ where: { id }, data: { status: "INACTIVE" } });
    await logActivity({
      userId: session.user.id,
      action: "DEACTIVATE_DEPARTMENT",
      entityType: "Department",
      entityId: id,
    });
    revalidatePath("/organization");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to deactivate department" };
  }
}

// ─── ASSET CATEGORY ──────────────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const session = await requireRole(["ADMIN"]);

  let customFieldsObj = undefined;
  const customFieldsRaw = formData.get("customFields") as string;
  if (customFieldsRaw) {
    try {
      customFieldsObj = JSON.parse(customFieldsRaw);
    } catch (e) {
      return { error: "Invalid JSON for custom fields" };
    }
  }

  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    customFields: customFieldsObj,
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const cat = await db.assetCategory.create({ data: parsed.data });
  await logActivity({
    userId: session.user.id,
    action: "CREATE_CATEGORY",
    entityType: "AssetCategory",
    entityId: cat.id,
  });
  revalidatePath("/organization");
  return { success: true, id: cat.id };
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await requireRole(["ADMIN"]);

  let customFieldsObj = undefined;
  const customFieldsRaw = formData.get("customFields") as string;
  if (customFieldsRaw) {
    try {
      customFieldsObj = JSON.parse(customFieldsRaw);
    } catch (e) {
      return { error: "Invalid JSON for custom fields" };
    }
  }

  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    customFields: customFieldsObj,
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.assetCategory.update({ where: { id }, data: parsed.data });
  await logActivity({
    userId: session.user.id,
    action: "UPDATE_CATEGORY",
    entityType: "AssetCategory",
    entityId: id,
  });
  revalidatePath("/organization");
  return { success: true };
}

// ─── EMPLOYEE ────────────────────────────────────────────────────────────────

export async function updateEmployeeRole(userId: string, role: string) {
  const session = await requireRole(["ADMIN"]);

  const parsed = employeeRoleSchema.safeParse({ userId, role });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.user.update({ where: { id: userId }, data: { role: parsed.data.role } });
  await logActivity({
    userId: session.user.id,
    action: "UPDATE_EMPLOYEE_ROLE",
    entityType: "User",
    entityId: userId,
    metadata: { newRole: role },
  });
  await createNotification({
    userId,
    type: "ROLE_CHANGED",
    title: "Your role has been updated",
    message: `Your account role has been changed to ${role.replace("_", " ").toLowerCase()}.`,
    entityType: "User",
    entityId: userId,
  });
  revalidatePath("/organization");
  return { success: true };
}

export async function updateEmployeeStatus(userId: string, status: string) {
  const session = await requireRole(["ADMIN"]);

  const parsed = employeeStatusSchema.safeParse({ userId, status });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.user.update({ where: { id: userId }, data: { status: parsed.data.status } });
  await logActivity({
    userId: session.user.id,
    action: "UPDATE_EMPLOYEE_STATUS",
    entityType: "User",
    entityId: userId,
    metadata: { newStatus: status },
  });
  revalidatePath("/organization");
  return { success: true };
}
