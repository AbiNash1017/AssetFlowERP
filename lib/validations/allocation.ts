import { z } from "zod";

export const allocationSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  userId: z.string().optional(),
  departmentId: z.string().optional(),
  expectedReturnDate: z.string().optional(),
}).refine((d) => d.userId || d.departmentId, {
  message: "Either an employee or a department must be selected",
  path: ["userId"],
});

export const returnAssetSchema = z.object({
  allocationId: z.string().min(1, "Allocation ID is required"),
  conditionNotes: z.string().optional(),
});

export const transferRequestSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  toUserId: z.string().min(1, "Target employee is required"),
  notes: z.string().optional(),
});

export type AllocationInput = z.infer<typeof allocationSchema>;
export type ReturnAssetInput = z.infer<typeof returnAssetSchema>;
export type TransferRequestInput = z.infer<typeof transferRequestSchema>;
