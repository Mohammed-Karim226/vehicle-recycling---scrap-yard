import "server-only";

import { prisma } from "@/lib/prisma";
import { cleanupExpiredRateLimits } from "@/lib/security/rateLimit";

export async function runRetentionMaintenance(): Promise<{
  partRequests: number;
  scrapValuations: number;
  rateLimits: number;
}> {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const [partRequests, scrapValuations, rateLimits] = await Promise.all([
    prisma.partRequest.deleteMany({
      where: { status: { in: ["No_Stock", "Cancelled"] }, updatedAt: { lt: cutoff } },
    }),
    prisma.scrapValuation.deleteMany({
      where: { status: "Rejected", updatedAt: { lt: cutoff } },
    }),
    cleanupExpiredRateLimits(),
  ]);

  return {
    partRequests: partRequests.count,
    scrapValuations: scrapValuations.count,
    rateLimits,
  };
}
