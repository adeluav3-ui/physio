-- Admin-edited animation override for each exercise (JSONB, nullable)
ALTER TABLE "Exercise" ADD COLUMN "poseData" JSONB;
