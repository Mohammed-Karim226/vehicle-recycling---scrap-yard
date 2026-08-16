import "server-only";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { RateLimitError } from "@/lib/errors";

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function clientIdentifier(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return hashIdentifier(forwarded || requestHeaders.get("x-real-ip") || "unknown-client");
}

export async function enforceRateLimit(
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const identity = await clientIdentifier();
  const key = `${scope}:${identity}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "expiresAt")
    VALUES (${key}, 1, ${now}, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${now}
        ELSE "RateLimitBucket"."windowStart"
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt}
        ELSE "RateLimitBucket"."expiresAt"
      END
    RETURNING "count"
  `;

  if ((rows[0]?.count ?? limit + 1) > limit) {
    throw new RateLimitError();
  }
}

export async function clearRateLimit(scope: string): Promise<void> {
  const identity = await clientIdentifier();
  await prisma.rateLimitBucket.deleteMany({
    where: { key: `${scope}:${identity}` },
  });
}

export async function cleanupExpiredRateLimits(): Promise<number> {
  const result = await prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "expiresAt" < NOW()`;
  return Number(result);
}
