import { z } from "zod";

const scrapQuoteHourlyLimitSchema = z.coerce.number().int().min(1).max(10_000).default(60);
const configuredAdminSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

export type ConfiguredAdmin = z.infer<typeof configuredAdminSchema>;

export function getConfiguredAdmin(): ConfiguredAdmin | undefined {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email === undefined && password === undefined) return undefined;

  const parsed = configuredAdminSchema.safeParse({ email, password });
  if (!parsed.success) {
    throw new Error("Set ADMIN_EMAIL to a valid email and ADMIN_PASSWORD to a password of 8–128 characters.");
  }
  return parsed.data;
}

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DIRECT_URL: z.string().min(1).optional(),
    ADMIN_SESSION_SECRET: z.string().min(32),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    // DVLA VES API
    DVLA_API_KEY: z.string().trim().min(1).optional(),
    DVLA_API_URL: z.enum([
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
      'https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
    ]).optional(),
    SCRAP_QUOTE_HOURLY_LIMIT: scrapQuoteHourlyLimitSchema,
    // DVSA MOT History API
    MOT_API_KEY: z.string().min(1).optional(),
    DVSA_CLIENT_ID: z.string().min(1).optional(),
    DVSA_CLIENT_SECRET: z.string().min(1).optional(),
    DVSA_SCOPE_URL: z.string().url().optional(),
    DVSA_TOKEN_URL: z.string().url().optional(),
  })
  .superRefine((data, ctx) => {
    const hasUrl = Boolean(data.NEXT_PUBLIC_SUPABASE_URL);
    const hasKey = Boolean(data.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (hasUrl !== hasKey) {
      ctx.addIssue({
        code: "custom",
        message:
          "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must both be set or both omitted",
        path: ["NEXT_PUBLIC_SUPABASE_URL"],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;
const DEVELOPMENT_SESSION_SECRET = "dev-admin-session-secret-change-before-production";

// Public quotes only need their own limit, independent of admin or storage setup.
export function getScrapQuoteHourlyLimit(): number {
  const parsed = scrapQuoteHourlyLimitSchema.safeParse(process.env.SCRAP_QUOTE_HOURLY_LIMIT);
  if (!parsed.success) {
    throw new Error("Invalid environment configuration: SCRAP_QUOTE_HOURLY_LIMIT must be a whole number from 1 to 10000");
  }
  return parsed.data;
}

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    ADMIN_SESSION_SECRET:
      process.env.ADMIN_SESSION_SECRET ??
      (process.env.NODE_ENV === "production" ? undefined : DEVELOPMENT_SESSION_SECRET),
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DVLA_API_KEY: process.env.DVLA_API_KEY,
    DVLA_API_URL: process.env.DVLA_API_URL,
    SCRAP_QUOTE_HOURLY_LIMIT: process.env.SCRAP_QUOTE_HOURLY_LIMIT,
    MOT_API_KEY: process.env.MOT_API_KEY,
    DVSA_CLIENT_ID: process.env.DVSA_CLIENT_ID,
    DVSA_CLIENT_SECRET: process.env.DVSA_CLIENT_SECRET,
    DVSA_SCOPE_URL: process.env.DVSA_SCOPE_URL,
    DVSA_TOKEN_URL: process.env.DVSA_TOKEN_URL,
  });

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function isSupabaseConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
