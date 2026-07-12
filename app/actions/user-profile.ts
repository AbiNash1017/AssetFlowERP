"use server";

import db from "@/lib/db";
import { requireSession } from "@/lib/rbac-server";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(name: string, imageUrl: string | null) {
  const session = await requireSession();

  if (!name.trim()) {
    return { error: "Name cannot be empty." };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        ...(imageUrl !== undefined && { image: imageUrl }),
      },
    });

    // Revalidate all dashboard pages to pick up new name/image from session
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update user profile:", error);
    return { error: error.message || "Failed to update profile." };
  }
}
