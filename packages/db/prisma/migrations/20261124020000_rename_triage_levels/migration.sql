-- Rename triage enum values for the online-only launch scope.
-- AMBER → FLAG  (can book online; physio should review carefully)
-- RED   → IN_PERSON_REQUIRED  (cannot book online; must attend in person)
ALTER TYPE "TriageLevel" RENAME VALUE 'AMBER' TO 'FLAG';
ALTER TYPE "TriageLevel" RENAME VALUE 'RED' TO 'IN_PERSON_REQUIRED';
