-- Add version column to Program (missed in earlier migration)
ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
