import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

/**
 * Get current session on Server Components, Server Actions, or API Routes
 */
export async function getServerSession() {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("Failed to fetch server session:", error);
    return null;
  }
}

/**
 * Require a logged-in user session or throw an error
 */
export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: Session required");
  }
  return session;
}

/**
 * Require specific user roles or throw an error
 */
export async function requireRole(allowedRoles: Role[]) {
  const session = await requireSession();
  const userRole = (session.user as unknown as { role?: Role })?.role;
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new Error("FORBIDDEN: Insufficient role permissions");
  }
  
  return session;
}
