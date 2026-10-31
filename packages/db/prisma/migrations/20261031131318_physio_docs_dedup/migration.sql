-- Add document upload columns to PhysioProfile
ALTER TABLE "PhysioProfile" ADD COLUMN "licenceDocUrl" TEXT;
ALTER TABLE "PhysioProfile" ADD COLUMN "certificateUrl" TEXT;
ALTER TABLE "PhysioProfile" ADD COLUMN "ninNumber" TEXT;
ALTER TABLE "PhysioProfile" ADD COLUMN "ninDocUrl" TEXT;

-- Rate is now admin-controlled; default to 0 for new rows
ALTER TABLE "PhysioProfile" ALTER COLUMN "rateKobo" SET DEFAULT 0;

-- Enforce uniqueness on licence number to prevent the same professional
-- registering multiple accounts
CREATE UNIQUE INDEX "PhysioProfile_licenceNo_key" ON "PhysioProfile"("licenceNo");

-- Enforce uniqueness on NIN (nullable: NULL values do not conflict)
CREATE UNIQUE INDEX "PhysioProfile_ninNumber_key" ON "PhysioProfile"("ninNumber");
