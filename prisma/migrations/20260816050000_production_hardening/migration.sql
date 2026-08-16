-- Exact monetary values, private customer tracking tokens, bounded-query indexes,
-- database constraints, and shared rate-limit storage.
ALTER TABLE "ScrapMetalPrice"
  ALTER COLUMN "pricePerKgMin" TYPE DECIMAL(12,4) USING "pricePerKgMin"::DECIMAL(12,4),
  ALTER COLUMN "pricePerKgMax" TYPE DECIMAL(12,4) USING "pricePerKgMax"::DECIMAL(12,4);

ALTER TABLE "ScrapValuation"
  ADD COLUMN "trackingToken" UUID NOT NULL DEFAULT gen_random_uuid(),
  ALTER COLUMN "estimatedValue" TYPE DECIMAL(12,2) USING "estimatedValue"::DECIMAL(12,2),
  ALTER COLUMN "weightKg" TYPE DECIMAL(10,2) USING "weightKg"::DECIMAL(10,2);

ALTER TABLE "PartRequest"
  ADD COLUMN "trackingToken" UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX "ScrapValuation_trackingToken_key" ON "ScrapValuation"("trackingToken");
CREATE UNIQUE INDEX "PartRequest_trackingToken_key" ON "PartRequest"("trackingToken");
CREATE INDEX "VehicleYard_arrivedDate_id_idx" ON "VehicleYard"("arrivedDate", "id");
CREATE INDEX "ScrapValuation_createdAt_id_idx" ON "ScrapValuation"("createdAt", "id");
CREATE INDEX "ScrapValuation_status_updatedAt_idx" ON "ScrapValuation"("status", "updatedAt");
CREATE INDEX "PartRequest_createdAt_id_idx" ON "PartRequest"("createdAt", "id");
CREATE INDEX "PartRequest_status_updatedAt_idx" ON "PartRequest"("status", "updatedAt");
DROP INDEX IF EXISTS "ScrapMetalPrice_category_idx";

-- Normalize legacy price rows before enforcing the invariant. Both assignments
-- read the original row values, so reversed bounds are swapped safely.
UPDATE "ScrapMetalPrice"
SET
  "pricePerKgMin" = GREATEST(0, LEAST("pricePerKgMin", "pricePerKgMax")),
  "pricePerKgMax" = GREATEST(0, GREATEST("pricePerKgMin", "pricePerKgMax"))
WHERE
  "pricePerKgMin" < 0
  OR "pricePerKgMax" < 0
  OR "pricePerKgMin" > "pricePerKgMax";

ALTER TABLE "ScrapMetalPrice"
  ADD CONSTRAINT "ScrapMetalPrice_nonnegative_check" CHECK ("pricePerKgMin" >= 0 AND "pricePerKgMax" >= 0),
  ADD CONSTRAINT "ScrapMetalPrice_range_check" CHECK ("pricePerKgMin" <= "pricePerKgMax");
ALTER TABLE "ScrapValuation"
  ADD CONSTRAINT "ScrapValuation_values_check" CHECK ("estimatedValue" >= 0 AND "weightKg" > 0);
ALTER TABLE "VehicleYard"
  ADD CONSTRAINT "VehicleYard_year_check" CHECK ("year" BETWEEN 1900 AND 2200);

CREATE TABLE "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
