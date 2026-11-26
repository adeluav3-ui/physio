-- PilotSettings: singleton row (id=1) that admin edits to control pilot mode,
-- pilot dates, and pricing rates during the Dec 2026 – Mar 2027 pilot.
CREATE TABLE "pilot_settings" (
    "id"                     INTEGER NOT NULL DEFAULT 1,
    "pilotModeEnabled"       BOOLEAN NOT NULL DEFAULT false,
    "pilotStartDate"         TIMESTAMP(3) NOT NULL DEFAULT '2026-12-01 00:00:00',
    "pilotEndDate"           TIMESTAMP(3) NOT NULL DEFAULT '2027-03-01 00:00:00',
    "commissionBps"          INTEGER NOT NULL DEFAULT 1000,
    "serviceFeeBps"          INTEGER NOT NULL DEFAULT 500,
    "serviceFeeCapKobo"      INTEGER NOT NULL DEFAULT 50000,
    "freeIntroVideoSessions" INTEGER NOT NULL DEFAULT 2,
    "videoAddonKobo"         INTEGER NOT NULL DEFAULT 50000,
    "sessionTarget"          INTEGER NOT NULL DEFAULT 200,
    "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy"              TEXT,

    CONSTRAINT "pilot_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pilot_settings_singleton" CHECK ("id" = 1)
);

-- Seed the singleton row with pilot values ready to activate.
INSERT INTO "pilot_settings" (
    "id", "pilotModeEnabled",
    "commissionBps", "serviceFeeBps", "serviceFeeCapKobo",
    "freeIntroVideoSessions", "videoAddonKobo", "sessionTarget"
) VALUES (
    1, false,
    500, 250, 50000,
    10, 25000, 200
);

-- Rate snapshot columns on Payment: values locked in at booking time.
-- NULL on pre-existing payments (rate was not snapshotted before this migration).
ALTER TABLE "Payment"
    ADD COLUMN "commissionBpsPaid"     INTEGER,
    ADD COLUMN "serviceFeeBpsPaid"     INTEGER,
    ADD COLUMN "serviceFeeCapKoboPaid" INTEGER,
    ADD COLUMN "videoAddonKoboPaid"    INTEGER;
