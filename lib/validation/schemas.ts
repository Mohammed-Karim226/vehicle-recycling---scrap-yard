import { z } from "zod";

export const uuidSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(z.string().uuid("Invalid reference ID format"));

export const quoteInputSchema = z.object({
  registration: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, "").toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9]{2,12}$/)),
  postcode: z
    .string()
    .trim()
    .transform((value) => value.replace(/\s+/g, "").toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9]{3,10}$/)),
});

export const partRequestCreateSchema = z.object({
  vehicleId: z.string().trim().max(100).optional().nullable(),
  vehicleName: z.string().trim().min(1).max(200),
  partsNeeded: z.string().trim().min(3).max(2000),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/),
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
  estimatedValue: z.number().min(0).max(1000000).optional(),
});

export const partRequestUpdateSchema = z.object({
  status: z
    .enum(["Pending_Search", "Part_Located", "Shipped", "No_Stock", "Cancelled"])
    .optional(),
  notes: z.string().max(2000).optional().nullable(),
});

const scrapMetalPriceFields = {
  category: z.string().trim().min(1).max(100),
  pricePerKgMin: z.number().min(0).max(10000),
  pricePerKgMax: z.number().min(0).max(10000),
  trend: z.enum(["Rising", "Stable", "Falling"]).default("Stable"),
};

const priceRangeRefinement = (value: { pricePerKgMin?: number; pricePerKgMax?: number }) =>
  value.pricePerKgMin === undefined ||
  value.pricePerKgMax === undefined ||
  value.pricePerKgMin <= value.pricePerKgMax;

export const scrapMetalPriceCreateSchema = z.object(scrapMetalPriceFields).refine((value) =>
  priceRangeRefinement(value), {
  message: "Minimum price must not exceed maximum price",
  path: ["pricePerKgMax"],
});

export const scrapMetalPriceUpdateSchema = z.object(scrapMetalPriceFields).partial().refine((value) =>
  priceRangeRefinement(value), {
  message: "Minimum price must not exceed maximum price",
  path: ["pricePerKgMax"],
});

const catalyticConverterBaseSchema = z.object({
  category: z.string().trim().min(1).max(100),
  make: z.string().trim().min(1).max(100).optional().nullable(),
  model: z.string().trim().min(1).max(100).optional().nullable(),
  yearFrom: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  yearTo: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  price: z.number().min(0).max(100000),
  trend: z.enum(["Rising", "Stable", "Falling"]).default("Stable"),
  active: z.boolean().default(true),
});

const yearRangeCheck = (data: { yearFrom?: number | null; yearTo?: number | null }) =>
  !(data.yearFrom != null && data.yearTo != null && data.yearFrom > data.yearTo);

const yearRangeError = {
  message: "yearFrom cannot be greater than yearTo",
  path: ["yearFrom"] as PropertyKey[],
};

export const catalyticConverterCreateSchema = catalyticConverterBaseSchema.refine(
  yearRangeCheck,
  yearRangeError
);

// Refinements must be applied after .partial(); Zod cannot make a refined schema partial.
export const catalyticConverterUpdateSchema = catalyticConverterBaseSchema
  .partial()
  .refine(yearRangeCheck, yearRangeError);

export const catalyticConverterLookupSchema = z.object({
  make: z.string().trim().min(1).max(100).optional(),
  model: z.string().trim().min(1).max(100).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  category: z.string().trim().min(1).max(100).optional(),
});

export const idsBatchSchema = z.object({
  partIds: z.array(uuidSchema).max(50).default([]),
  scrapIds: z.array(uuidSchema).max(50).default([]),
});
