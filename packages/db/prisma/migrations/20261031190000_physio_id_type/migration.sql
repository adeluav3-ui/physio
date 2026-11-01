-- Add government ID type field to PhysioProfile
-- Supports: NIN, Driver's License, International Passport, Voter's Card
ALTER TABLE "PhysioProfile" ADD COLUMN IF NOT EXISTS "idType" TEXT;
