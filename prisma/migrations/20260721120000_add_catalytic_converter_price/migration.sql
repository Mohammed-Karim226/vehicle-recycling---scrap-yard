-- CreateTable
CREATE TABLE "CatalyticConverterPrice" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "price" DOUBLE PRECISION NOT NULL,
    "trend" "PriceTrend" NOT NULL DEFAULT 'Stable',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalyticConverterPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalyticConverterPrice_category_key" ON "CatalyticConverterPrice"("category");

-- CreateIndex
CREATE INDEX "CatalyticConverterPrice_category_idx" ON "CatalyticConverterPrice"("category");

-- CreateIndex
CREATE INDEX "CatalyticConverterPrice_make_model_idx" ON "CatalyticConverterPrice"("make", "model");

-- CreateIndex
CREATE INDEX "CatalyticConverterPrice_active_idx" ON "CatalyticConverterPrice"("active");
