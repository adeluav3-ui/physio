-- Add document upload columns to PhysioProfile
ALTER TABLE "PhysioProfile" ADD COLUMN IF NOT EXISTS "licenceDocUrl" TEXT;
ALTER TABLE "PhysioProfile" ADD COLUMN IF NOT EXISTS "certificateUrl" TEXT;
ALTER TABLE "PhysioProfile" ADD COLUMN IF NOT EXISTS "ninNumber" TEXT;
ALTER TABLE "PhysioProfile" ADD COLUMN IF NOT EXISTS "ninDocUrl" TEXT;

-- Rate is now admin-controlled; default to 0 for new rows
ALTER TABLE "PhysioProfile" ALTER COLUMN "rateKobo" SET DEFAULT 0;

-- NOTE: licenceNo unique index is intentionally omitted here because existing
-- test rows have empty licenceNo values. The service layer enforces uniqueness
-- for all new applications. The index will be added in a future migration once
-- existing rows are cleaned up.

-- Enforce uniqueness on NIN (nullable: NULL values do not conflict)
CREATE UNIQUE INDEX IF NOT EXISTS "PhysioProfile_ninNumber_key" ON "PhysioProfile"("ninNumber");
