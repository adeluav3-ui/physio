-- Add signedAt and signedBy to SessionNote.
-- These columns were present in the Prisma schema but were never included
-- in a migration, so the production database was missing them.
ALTER TABLE "SessionNote" ADD COLUMN IF NOT EXISTS "signedAt" TIMESTAMP(3);
ALTER TABLE "SessionNote" ADD COLUMN IF NOT EXISTS "signedBy" TEXT;
