-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('PHYSIOTHERAPY', 'OCCUPATIONAL_THERAPY', 'SPEECH_THERAPY', 'PROSTHETICS', 'ORTHOTICS');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('SENT', 'PATIENT_CONSENTED', 'ACCEPTED', 'DECLINED', 'BOOKED', 'SESSION_HELD', 'SUMMARY_SENT', 'CONFIRMED', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReferralUrgency" AS ENUM ('ROUTINE', 'SOON', 'URGENT');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('EXERCISE', 'GOAL');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "dependentId" TEXT;

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "clinicalReview" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Intake" ADD COLUMN     "dependentId" TEXT;

-- AlterTable
ALTER TABLE "PhysioProfile" ADD COLUMN     "discipline" "Discipline" NOT NULL DEFAULT 'PHYSIOTHERAPY',
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "licensingBody" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "sessionTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "WaitlistEntry" ADD COLUMN     "discipline" TEXT,
ADD COLUMN     "licensingBody" TEXT,
ADD COLUMN     "pilotTester" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Dependent" (
    "id" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "sex" TEXT,
    "relationship" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dependent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "fromProfessionalId" TEXT NOT NULL,
    "toDiscipline" "Discipline" NOT NULL,
    "toProfessionalId" TEXT,
    "patientId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" "ReferralUrgency" NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'SENT',
    "declineReason" TEXT,
    "summary" TEXT,
    "shareAssessmentNote" BOOLEAN NOT NULL DEFAULT false,
    "sharePlan" BOOLEAN NOT NULL DEFAULT false,
    "shareMessages" BOOLEAN NOT NULL DEFAULT false,
    "patientConsented" BOOLEAN NOT NULL DEFAULT false,
    "patientConsentedAt" TIMESTAMP(3),
    "appointmentId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralAudit" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "actorId" TEXT,
    "fromStatus" "ReferralStatus",
    "toStatus" "ReferralStatus" NOT NULL,
    "note" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalPlan" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "goalPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeTask" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskLog" (
    "id" TEXT NOT NULL,
    "practiceTaskId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicensingBody" (
    "id" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'NG',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicensingBody_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dependent_caregiverId_idx" ON "Dependent"("caregiverId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_appointmentId_key" ON "Referral"("appointmentId");

-- CreateIndex
CREATE INDEX "Referral_fromProfessionalId_status_idx" ON "Referral"("fromProfessionalId", "status");

-- CreateIndex
CREATE INDEX "Referral_toProfessionalId_status_idx" ON "Referral"("toProfessionalId", "status");

-- CreateIndex
CREATE INDEX "Referral_patientId_idx" ON "Referral"("patientId");

-- CreateIndex
CREATE INDEX "Referral_toDiscipline_status_idx" ON "Referral"("toDiscipline", "status");

-- CreateIndex
CREATE INDEX "ReferralAudit_referralId_at_idx" ON "ReferralAudit"("referralId", "at");

-- CreateIndex
CREATE INDEX "GoalPlan_patientId_status_idx" ON "GoalPlan"("patientId", "status");

-- CreateIndex
CREATE INDEX "GoalPlan_professionalId_idx" ON "GoalPlan"("professionalId");

-- CreateIndex
CREATE INDEX "Goal_goalPlanId_status_idx" ON "Goal"("goalPlanId", "status");

-- CreateIndex
CREATE INDEX "PracticeTask_goalId_idx" ON "PracticeTask"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskLog_practiceTaskId_date_key" ON "TaskLog"("practiceTaskId", "date");

-- CreateIndex
CREATE INDEX "LicensingBody_discipline_active_idx" ON "LicensingBody"("discipline", "active");

-- CreateIndex
CREATE UNIQUE INDEX "LicensingBody_discipline_name_country_key" ON "LicensingBody"("discipline", "name", "country");

-- CreateIndex
CREATE INDEX "Exercise_clinicalReview_idx" ON "Exercise"("clinicalReview");

-- CreateIndex
CREATE INDEX "PhysioProfile_discipline_licenceStatus_idx" ON "PhysioProfile"("discipline", "licenceStatus");

-- AddForeignKey
ALTER TABLE "Dependent" ADD CONSTRAINT "Dependent_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "PatientProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Dependent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Dependent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_fromProfessionalId_fkey" FOREIGN KEY ("fromProfessionalId") REFERENCES "PhysioProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_toProfessionalId_fkey" FOREIGN KEY ("toProfessionalId") REFERENCES "PhysioProfile"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralAudit" ADD CONSTRAINT "ReferralAudit_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalPlan" ADD CONSTRAINT "GoalPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalPlan" ADD CONSTRAINT "GoalPlan_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "PhysioProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_goalPlanId_fkey" FOREIGN KEY ("goalPlanId") REFERENCES "GoalPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeTask" ADD CONSTRAINT "PracticeTask_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLog" ADD CONSTRAINT "TaskLog_practiceTaskId_fkey" FOREIGN KEY ("practiceTaskId") REFERENCES "PracticeTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
