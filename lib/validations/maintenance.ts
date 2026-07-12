import { z } from "zod";

export const maintenanceRequestSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  issue: z.string().min(10, "Please describe the issue in at least 10 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  photoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const resolveMaintenanceSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  resolutionNotes: z.string().optional(),
});

export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>;
export type ResolveMaintenanceInput = z.infer<typeof resolveMaintenanceSchema>;
