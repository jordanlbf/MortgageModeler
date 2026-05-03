-- CreateEnum
CREATE TYPE "PropertyUse" AS ENUM ('INVESTMENT', 'PPOR');

-- CreateEnum
CREATE TYPE "PurchaseMode" AS ENUM ('NEW', 'EXISTING');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "suburb" TEXT,
    "propertyUse" "PropertyUse" NOT NULL,
    "purchaseMode" "PurchaseMode" NOT NULL,
    "purchasePrice" DECIMAL(14,2) NOT NULL,
    "purchaseDate" DATE NOT NULL,
    "inputs" JSONB NOT NULL,
    "inputsVersion" INTEGER NOT NULL DEFAULT 1,
    "cashflowResult" JSONB,
    "cashflowVersion" INTEGER,
    "annualCashflow" DECIMAL(14,2),
    "currentEquity" DECIMAL(14,2),
    "computedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_userId_updatedAt_idx" ON "properties"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
