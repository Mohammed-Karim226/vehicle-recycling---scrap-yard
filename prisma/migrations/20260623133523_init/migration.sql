-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('In_Yard', 'Dismantled', 'Scrapped');

-- CreateEnum
CREATE TYPE "PriceTrend" AS ENUM ('Rising', 'Stable', 'Falling');

-- CreateEnum
CREATE TYPE "PartRequestStatus" AS ENUM ('Pending_Search', 'Part_Located', 'Shipped', 'No_Stock', 'Cancelled');

-- CreateEnum
CREATE TYPE "ScrapQuoteStatus" AS ENUM ('Pending', 'Approved', 'Rejected', 'Completed');

-- CreateTable
CREATE TABLE "VehicleYard" (
    "id" UUID NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "trim" TEXT NOT NULL,
    "arrivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "VehicleStatus" NOT NULL DEFAULT 'In_Yard',
    "image" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleYard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapMetalPrice" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "pricePerKgMin" DOUBLE PRECISION NOT NULL,
    "pricePerKgMax" DOUBLE PRECISION NOT NULL,
    "trend" "PriceTrend" NOT NULL DEFAULT 'Stable',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapMetalPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapValuation" (
    "id" UUID NOT NULL,
    "registration" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "engineSize" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "status" "ScrapQuoteStatus" NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapValuation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartRequest" (
    "id" UUID NOT NULL,
    "vehicleId" TEXT,
    "vehicleName" TEXT NOT NULL,
    "partsNeeded" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "PartRequestStatus" NOT NULL DEFAULT 'Pending_Search',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleYard_make_idx" ON "VehicleYard"("make");

-- CreateIndex
CREATE INDEX "VehicleYard_model_idx" ON "VehicleYard"("model");

-- CreateIndex
CREATE INDEX "VehicleYard_status_idx" ON "VehicleYard"("status");

-- CreateIndex
CREATE INDEX "ScrapMetalPrice_category_idx" ON "ScrapMetalPrice"("category");

-- CreateIndex
CREATE INDEX "ScrapValuation_registration_idx" ON "ScrapValuation"("registration");

-- CreateIndex
CREATE INDEX "ScrapValuation_postcode_idx" ON "ScrapValuation"("postcode");

-- CreateIndex
CREATE INDEX "ScrapValuation_status_idx" ON "ScrapValuation"("status");

-- CreateIndex
CREATE INDEX "PartRequest_vehicleName_idx" ON "PartRequest"("vehicleName");

-- CreateIndex
CREATE INDEX "PartRequest_status_idx" ON "PartRequest"("status");
