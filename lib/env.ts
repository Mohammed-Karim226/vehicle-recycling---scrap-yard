import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DIRECT_URL: z.string().min(1).optional(),
    ADMIN_PIN_HASH: z
      .string()
      .length(64)
      .default("03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"),
    ADMIN_SESSION_SECRET: z.string().min(16),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
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

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    ADMIN_PIN_HASH: process.env.ADMIN_PIN_HASH,
    ADMIN_SESSION_SECRET:
      process.env.ADMIN_SESSION_SECRET ??
      (process.env.NODE_ENV === "production" ? undefined : "dev-admin-session-secret"),
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
