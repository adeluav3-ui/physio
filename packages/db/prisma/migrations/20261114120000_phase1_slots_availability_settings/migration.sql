-- Phase 1: slot-holds, days-off, and physio availability settings
-- Adds sessionMinutes, bufferMinutes, acceptingPatients to PhysioProfile
-- Creates SlotHold and DayOff tables

ALTER TABLE "PhysioProfile"
  ADD COLUMN IF NOT EXISTS "sessionMinutes"    INTEGER NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS "bufferMinutes"     INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS "acceptingPatients" BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS "PhysioProfile_acceptingPatients_licenceStatus_idx"
  ON "PhysioProfile"("acceptingPatients", "licenceStatus");

CREATE TABLE IF NOT EXISTS "SlotHold" (
  "id"            TEXT NOT NULL,
  "physioId"      TEXT NOT NULL,
  "patientId"     TEXT NOT NULL,
  "startsAt"      TIMESTAMP(3) NOT NULL,
  "endsAt"        TIMESTAMP(3) NOT NULL,
  "expiresAt"     TIMESTAMP(3) NOT NULL,
  "appointmentId" TEXT,

  CONSTRAINT "SlotHold_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SlotHold_appointmentId_key"
  ON "SlotHold"("appointmentId");

CREATE INDEX IF NOT EXISTS "SlotHold_physioId_startsAt_idx"
  ON "SlotHold"("physioId", "startsAt");

CREATE INDEX IF NOT EXISTS "SlotHold_expiresAt_idx"
  ON "SlotHold"("expiresAt");

ALTER TABLE "SlotHold"
  ADD CONSTRAINT "SlotHold_physioId_fkey"
  FOREIGN KEY ("physioId") REFERENCES "PhysioProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "DayOff" (
  "id"       TEXT NOT NULL,
  "physioId" TEXT NOT NULL,
  "date"     DATE NOT NULL,
  "reason"   TEXT,

  CONSTRAINT "DayOff_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DayOff"
  ADD CONSTRAINT "DayOff_physioId_fkey"
  FOREIGN KEY ("physioId") REFERENCES "PhysioProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
