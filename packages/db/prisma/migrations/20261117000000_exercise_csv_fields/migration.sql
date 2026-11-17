-- Add CSV-sourced fields and animation link to Exercise

ALTER TABLE "Exercise" ADD COLUMN "csvId"      TEXT;
ALTER TABLE "Exercise" ADD COLUMN "joint"      TEXT;
ALTER TABLE "Exercise" ADD COLUMN "purpose"    TEXT;
ALTER TABLE "Exercise" ADD COLUMN "goal"       TEXT;
ALTER TABLE "Exercise" ADD COLUMN "conditions" TEXT;
ALTER TABLE "Exercise" ADD COLUMN "position"   TEXT;
ALTER TABLE "Exercise" ADD COLUMN "howTo"      TEXT;
ALTER TABLE "Exercise" ADD COLUMN "dose"       TEXT;
ALTER TABLE "Exercise" ADD COLUMN "progression" TEXT;
ALTER TABLE "Exercise" ADD COLUMN "precautions" TEXT;
ALTER TABLE "Exercise" ADD COLUMN "equipment"  TEXT;
ALTER TABLE "Exercise" ADD COLUMN "videoStatus" TEXT;
ALTER TABLE "Exercise" ADD COLUMN "poseKey"    TEXT;

-- Make cues nullable-safe (add default for existing rows)
ALTER TABLE "Exercise" ALTER COLUMN "cues" SET DEFAULT '';

CREATE UNIQUE INDEX "Exercise_csvId_key" ON "Exercise"("csvId");
CREATE INDEX "Exercise_csvId_idx" ON "Exercise"("csvId");
