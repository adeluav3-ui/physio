-- AlterTable: add discharge fields to Program
ALTER TABLE "Program" ADD COLUMN "dischargeSummary" TEXT;
ALTER TABLE "Program" ADD COLUMN "maintenancePlan" TEXT;
