import { Role } from "@prisma/client";

export const ROLES: Role[] = ["EMPLOYEE", "DEPARTMENT_HEAD", "ASSET_MANAGER", "ADMIN"];

export const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: "Employee",
  DEPARTMENT_HEAD: "Department Head",
  ASSET_MANAGER: "Asset Manager",
  ADMIN: "System Administrator",
};

/**
 * Access Control Rules
 */
export const permissions = {
  // Setup / Admin actions
  canManageOrganization: (role: Role) => role === "ADMIN",
  canPromoteRoles: (role: Role) => role === "ADMIN",
  
  // Asset Management
  canRegisterAsset: (role: Role) => role === "ASSET_MANAGER" || role === "ADMIN",
  canAllocateAsset: (role: Role) => role === "ASSET_MANAGER" || role === "ADMIN",
  canApproveReturn: (role: Role) => role === "ASSET_MANAGER" || role === "ADMIN",
  
  // Maintenance Management
  canApproveMaintenance: (role: Role) => role === "ASSET_MANAGER" || role === "ADMIN",
  canAssignTechnician: (role: Role) => role === "ASSET_MANAGER" || role === "ADMIN",
  canRaiseMaintenance: (role: Role) => true, // Everyone can raise maintenance requests

  // Bookings
  canBookResource: (role: Role) => true, // Everyone can book, but details differ
  canBookOnBehalfOfDepartment: (role: Role) => ["DEPARTMENT_HEAD", "ASSET_MANAGER", "ADMIN"].includes(role),

  // Transfer approval
  canApproveTransfer: (role: Role, userDepartmentId?: string, assetDepartmentId?: string) => {
    if (role === "ADMIN" || role === "ASSET_MANAGER") return true;
    if (role === "DEPARTMENT_HEAD") {
      // Dept head can approve if the asset belongs to their department or is moving within their department
      return !!userDepartmentId && (userDepartmentId === assetDepartmentId);
    }
    return false;
  },

  // Audit
  canManageAudits: (role: Role) => role === "ASSET_MANAGER" || role === "ADMIN",
  canPerformAudit: (role: Role, isAssignedAuditor: boolean) => {
    if (role === "ADMIN" || role === "ASSET_MANAGER") return true;
    return isAssignedAuditor;
  },

  // View Reports
  canViewReports: (role: Role) => ["DEPARTMENT_HEAD", "ASSET_MANAGER", "ADMIN"].includes(role),
};
