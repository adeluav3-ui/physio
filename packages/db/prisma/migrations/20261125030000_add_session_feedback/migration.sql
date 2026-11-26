-- Post-session and end-of-pilot feedback forms.
-- No patient names stored here; exports anonymise by appointment ID only.

CREATE TYPE "FeedbackFormType" AS ENUM (
    'PATIENT_SESSION',
    'SPECIALIST_SESSION',
    'PATIENT_END_OF_PILOT',
    'SPECIALIST_END_OF_PILOT'
);

CREATE TABLE "SessionFeedback" (
    "id"                   TEXT NOT NULL,
    "formType"             "FeedbackFormType" NOT NULL,
    "appointmentId"        TEXT,
    "submittedById"        TEXT NOT NULL,
    "painScore"            INTEGER,
    "functionScore"        INTEGER,
    "overallRating"        INTEGER,
    "communicationRating"  INTEGER,
    "whatWentWell"         TEXT,
    "whatCouldImprove"     TEXT,
    "wouldRecommend"       BOOLEAN,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SessionFeedback_formType_createdAt_idx" ON "SessionFeedback"("formType", "createdAt");
CREATE INDEX "SessionFeedback_appointmentId_idx"       ON "SessionFeedback"("appointmentId");
CREATE INDEX "SessionFeedback_submittedById_idx"       ON "SessionFeedback"("submittedById");

ALTER TABLE "SessionFeedback"
    ADD CONSTRAINT "SessionFeedback_appointmentId_fkey"
        FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "SessionFeedback_submittedById_fkey"
        FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
