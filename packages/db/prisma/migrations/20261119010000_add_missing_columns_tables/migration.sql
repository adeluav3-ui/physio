-- Add columns that exist in the schema but were never added via a migration.
-- All statements use IF NOT EXISTS / IF EXISTS guards so they are safe to
-- run against databases that already have some of these columns applied
-- manually.

-- ── Appointment: cancellation + dispute fields ────────────────────────────────
ALTER TABLE "Appointment"
  ADD COLUMN IF NOT EXISTS "cancelledAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelReason" TEXT,
  ADD COLUMN IF NOT EXISTS "disputeAt"    TIMESTAMP(3);

-- ── NoteAddendum ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "NoteAddendum" (
    "id"      TEXT NOT NULL,
    "noteId"  TEXT NOT NULL,
    "body"    TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteAddendum_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NoteAddendum_noteId_addedAt_idx"
    ON "NoteAddendum"("noteId", "addedAt");

ALTER TABLE "NoteAddendum"
  DROP CONSTRAINT IF EXISTS "NoteAddendum_noteId_fkey";
ALTER TABLE "NoteAddendum"
  ADD CONSTRAINT "NoteAddendum_noteId_fkey"
  FOREIGN KEY ("noteId") REFERENCES "SessionNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── PatientSummary ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PatientSummary" (
    "id"            TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "body"          TEXT NOT NULL,
    "approvedAt"    TIMESTAMP(3),
    "approvedBy"    TEXT,

    CONSTRAINT "PatientSummary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PatientSummary_appointmentId_key"
    ON "PatientSummary"("appointmentId");

ALTER TABLE "PatientSummary"
  DROP CONSTRAINT IF EXISTS "PatientSummary_appointmentId_fkey";
ALTER TABLE "PatientSummary"
  ADD CONSTRAINT "PatientSummary_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── SessionExercise ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "SessionExercise" (
    "id"            TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "exerciseId"    TEXT NOT NULL,
    "sentAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feel"          TEXT,
    "painScore"     INTEGER,
    "feedbackNote"  TEXT,
    "feedbackAt"    TIMESTAMP(3),

    CONSTRAINT "SessionExercise_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SessionExercise_appointmentId_idx"
    ON "SessionExercise"("appointmentId");

ALTER TABLE "SessionExercise"
  DROP CONSTRAINT IF EXISTS "SessionExercise_appointmentId_fkey";
ALTER TABLE "SessionExercise"
  ADD CONSTRAINT "SessionExercise_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SessionExercise"
  DROP CONSTRAINT IF EXISTS "SessionExercise_exerciseId_fkey";
ALTER TABLE "SessionExercise"
  ADD CONSTRAINT "SessionExercise_exerciseId_fkey"
  FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Package ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Package" (
    "id"          TEXT NOT NULL,
    "patientId"   TEXT NOT NULL,
    "physioId"    TEXT NOT NULL,
    "size"        INTEGER NOT NULL,
    "remaining"   INTEGER NOT NULL,
    "priceKobo"   INTEGER NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'ACTIVE',
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Package_patientId_status_idx" ON "Package"("patientId", "status");
CREATE INDEX IF NOT EXISTS "Package_physioId_idx"          ON "Package"("physioId");

ALTER TABLE "Package"
  DROP CONSTRAINT IF EXISTS "Package_patientId_fkey";
ALTER TABLE "Package"
  ADD CONSTRAINT "Package_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Package"
  DROP CONSTRAINT IF EXISTS "Package_physioId_fkey";
ALTER TABLE "Package"
  ADD CONSTRAINT "Package_physioId_fkey"
  FOREIGN KEY ("physioId") REFERENCES "PhysioProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── PackageSession ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PackageSession" (
    "id"            TEXT NOT NULL,
    "packageId"     TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "redeemedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PackageSession_appointmentId_key"
    ON "PackageSession"("appointmentId");

CREATE INDEX IF NOT EXISTS "PackageSession_packageId_idx"
    ON "PackageSession"("packageId");

ALTER TABLE "PackageSession"
  DROP CONSTRAINT IF EXISTS "PackageSession_packageId_fkey";
ALTER TABLE "PackageSession"
  ADD CONSTRAINT "PackageSession_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PackageSession"
  DROP CONSTRAINT IF EXISTS "PackageSession_appointmentId_fkey";
ALTER TABLE "PackageSession"
  ADD CONSTRAINT "PackageSession_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
