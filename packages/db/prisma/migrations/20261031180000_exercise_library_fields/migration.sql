-- Add exercise library fields: category, instructions, defaults, optional videoUrl, updatedAt

ALTER TABLE "Exercise" ADD COLUMN "category"           TEXT NOT NULL DEFAULT 'General';
ALTER TABLE "Exercise" ADD COLUMN "instructions"       TEXT;
ALTER TABLE "Exercise" ADD COLUMN "defaultSets"        INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Exercise" ADD COLUMN "defaultReps"        INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Exercise" ADD COLUMN "defaultHoldSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Exercise" ADD COLUMN "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT now();

-- Make videoUrl optional (allow NULL)
ALTER TABLE "Exercise" ALTER COLUMN "videoUrl" DROP NOT NULL;

-- Index on category for filtering
CREATE INDEX "Exercise_category_idx" ON "Exercise"("category");
