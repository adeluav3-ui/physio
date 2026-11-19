-- CHAT was added to the schema but no migration was ever created for it.
-- ANY was also missing (covered by 20261119020000 but guarded here too).
ALTER TYPE "SessionMode" ADD VALUE IF NOT EXISTS 'CHAT';
ALTER TYPE "SessionMode" ADD VALUE IF NOT EXISTS 'ANY';
