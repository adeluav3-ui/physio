-- FallbackCase: admin queue for patients triaged IN_PERSON_REQUIRED.
-- Admin team uses this to follow up and signpost to in-person services.
CREATE TYPE "FallbackCaseStatus" AS ENUM ('OPEN', 'CONTACTED', 'RESOLVED', 'CLOSED');

CREATE TABLE "FallbackCase" (
    "id"          TEXT NOT NULL,
    "intakeId"    TEXT NOT NULL,
    "patientId"   TEXT NOT NULL,
    "status"      "FallbackCaseStatus" NOT NULL DEFAULT 'OPEN',
    "adminNote"   TEXT,
    "resolvedAt"  TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FallbackCase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FallbackCase_intakeId_key" ON "FallbackCase"("intakeId");
CREATE INDEX "FallbackCase_status_createdAt_idx" ON "FallbackCase"("status", "createdAt");
CREATE INDEX "FallbackCase_patientId_idx" ON "FallbackCase"("patientId");

ALTER TABLE "FallbackCase" ADD CONSTRAINT "FallbackCase_intakeId_fkey"
    FOREIGN KEY ("intakeId") REFERENCES "Intake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FallbackCase" ADD CONSTRAINT "FallbackCase_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
