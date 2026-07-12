import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  code: z.string().min(2, "Department code is required").max(10, "Code must be under 10 characters"),
  headId: z.string().optional(),
  parentDepartmentId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  description: z.string().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

export const employeeRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["EMPLOYEE", "DEPARTMENT_HEAD", "ASSET_MANAGER", "ADMIN"]),
});

export const employeeStatusSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type EmployeeRoleInput = z.infer<typeof employeeRoleSchema>;
export type EmployeeStatusInput = z.infer<typeof employeeStatusSchema>;
