-- Record when an admin explicitly confirmed they cross-checked the MRTB register
-- before approving a physiotherapist. Required for pilot onboarding compliance.
ALTER TABLE "PhysioProfile"
    ADD COLUMN "mrtbCheckedAt" TIMESTAMP(3);
