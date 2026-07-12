import { z } from "zod";

export const assetSchema = z.object({
  name: z.string().min(2, "Asset name must be at least 2 characters"),
  categoryId: z.string().min(1, "Category is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  acquisitionDate: z.string().min(1, "Acquisition date is required"),
  acquisitionCost: z.number({ message: "Cost must be a number" }).min(0, "Cost must be non-negative"),
  condition: z.string().min(1, "Condition is required"),
  location: z.string().min(1, "Location is required"),
  isBookable: z.boolean().default(false),
  photoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type AssetInput = z.infer<typeof assetSchema>;
