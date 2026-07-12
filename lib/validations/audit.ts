import { z } from "zod";

export const auditCycleSchema = z.object({
  name: z.string().min(2, "Cycle name is required"),
  scope: z.enum(["DEPARTMENT", "LOCATION"]),
  scopeId: z.string().min(1, "Scope target (department or location) is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  auditorIds: z.array(z.string()).min(1, "At least one auditor must be assigned"),
}).refine((d) => new Date(d.endDate) > new Date(d.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const auditEntrySchema = z.object({
  cycleId: z.string().min(1),
  assetId: z.string().min(1),
  result: z.enum(["VERIFIED", "MISSING", "DAMAGED"]),
  notes: z.string().optional(),
});

export type AuditCycleInput = z.infer<typeof auditCycleSchema>;
export type AuditEntryInput = z.infer<typeof auditEntrySchema>;
