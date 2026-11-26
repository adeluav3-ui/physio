-- Mark a physiotherapist as a pilot participant.
-- Founding Specialist badge shown on their public profile while this is true.
ALTER TABLE "PhysioProfile"
    ADD COLUMN "pilotParticipant" BOOLEAN NOT NULL DEFAULT false;
