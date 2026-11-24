-- Add new LedgerEntryType enum values required for the online-launch fee split.
-- PLATFORM_FEE is kept for backward-compat with existing rows; new rows use COMMISSION + SERVICE_FEE.
ALTER TYPE "LedgerEntryType" ADD VALUE IF NOT EXISTS 'COMMISSION';
ALTER TYPE "LedgerEntryType" ADD VALUE IF NOT EXISTS 'SERVICE_FEE';
ALTER TYPE "LedgerEntryType" ADD VALUE IF NOT EXISTS 'VIDEO_ADDON';
ALTER TYPE "LedgerEntryType" ADD VALUE IF NOT EXISTS 'PROCESSOR_FEE';
