-- Performance indexes: foreign keys and query fields that were missing index coverage

-- Appointment: dependentId and intakeId FK lookups
CREATE INDEX IF NOT EXISTS "Appointment_dependentId_idx" ON "Appointment"("dependentId");
CREATE INDEX IF NOT EXISTS "Appointment_intakeId_idx" ON "Appointment"("intakeId");

-- SessionExercise: exerciseId FK (used for delete-guard check)
CREATE INDEX IF NOT EXISTS "SessionExercise_exerciseId_idx" ON "SessionExercise"("exerciseId");

-- WalletEntry: compound index covering idempotency check in creditRefund()
CREATE INDEX IF NOT EXISTS "WalletEntry_patientId_ref_type_idx" ON "WalletEntry"("patientId", "ref", "type");
