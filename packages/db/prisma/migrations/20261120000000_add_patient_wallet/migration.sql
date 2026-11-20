-- CreateEnum
CREATE TYPE "WalletEntryType" AS ENUM ('DEPOSIT', 'REFUND_CREDIT', 'SESSION_DEBIT');

-- CreateTable
CREATE TABLE "WalletEntry" (
    "id"          TEXT NOT NULL,
    "patientId"   TEXT NOT NULL,
    "amountKobo"  INTEGER NOT NULL,
    "type"        "WalletEntryType" NOT NULL,
    "ref"         TEXT,
    "note"        TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletEntry_patientId_createdAt_idx" ON "WalletEntry"("patientId", "createdAt");

-- AddForeignKey
ALTER TABLE "WalletEntry" ADD CONSTRAINT "WalletEntry_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("userId")
    ON DELETE CASCADE ON UPDATE CASCADE;
