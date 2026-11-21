-- Drop the unique constraint on Appointment.intakeId.
-- An intake can be linked to multiple appointment attempts (e.g. rebooking after a failed payment).
DROP INDEX IF EXISTS "Appointment_intakeId_key";
