import { z } from "zod";

export const uuidSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(z.string().uuid("Invalid reference ID format"));

export const quoteInputSchema = z.object({
  registration: z.string().trim().min(2).max(12),
  postcode: z.string().trim().min(3).max(10),
});

export const partRequestCreateSchema = z.object({
  vehicleId: z.string().trim().max(100).optional().nullable(),
  vehicleName: z.string().trim().min(1).max(200),
  partsNeeded: z.string().trim().min(3).max(2000),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
});

export const vehicleYardCreateSchema = z.object({
  make: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  trim: z.string().trim().min(1).max(100),
  status: z.enum(["In_Yard", "Dismantled", "Scrapped"]).default("In_Yard"),
  image: z.string().url().max(2048),
  color: z.string().trim().min(1).max(100),
});

export const vehicleYardUpdateSchema = vehicleYardCreateSchema.partial();

export const scrapValuationUpdateSchema = z.object({
  status: z.enum(["Pending", "Approved", "Rejected", "Completed"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const partRequestUpdateSchema = z.object({
  status: z
    .enum(["Pending_Search", "Part_Located", "Shipped", "No_Stock", "Cancelled"])
    .optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const scrapMetalPriceCreateSchema = z.object({
  category: z.string().trim().min(1).max(100),
  pricePerKgMin: z.number().min(0).max(10000),
  pricePerKgMax: z.number().min(0).max(10000),
  trend: z.enum(["Rising", "Stable", "Falling"]).default("Stable"),
});

export const scrapMetalPriceUpdateSchema = scrapMetalPriceCreateSchema.partial();

export const idsBatchSchema = z.object({
  partIds: z.array(uuidSchema).max(50).default([]),
  scrapIds: z.array(uuidSchema).max(50).default([]),
});
