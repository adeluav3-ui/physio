# FLOW STATUS — Phase 0 Audit

**Branch:** `feat/care-flow` (based on `origin/feat/rehab360-redesign`)
**Audit date:** 2026-11-14
**Auditor:** Claude Sonnet 4.6

---

## How to read this table

| Symbol | Meaning |
|--------|---------|
| ✅ EXISTS | Code present and wired end-to-end |
| ⚠️ PARTIAL | Code present but incomplete or not wired to the UI |
| ❌ MISSING | Not built |

---

## Phase 1 — Availability and slots

| Step | Status | Files | Notes |
|------|--------|-------|-------|
| Availability model (DB) | ✅ EXISTS | `packages/db/prisma/schema.prisma` → `Availability` | weekday, startMinute, endMinute, mode |
| `AvailabilityService.replaceAll` | ✅ EXISTS | `apps/api/src/booking/availability.service.ts` | Validates no overlaps, transactional replace |
| `SlotService.listForPhysio` | ⚠️ PARTIAL | `apps/api/src/booking/slot.service.ts` | Hardcoded `SLOT_DURATION_MIN = 45`; no buffer; no accepting-patients flag; no hold check |
| `SlotService.isSlotBookable` | ✅ EXISTS | same | Used in booking |
| Slot **holds** (reserve slot for N minutes) | ❌ MISSING | — | No `SlotHold` model; no BullMQ job to expire holds; race condition possible |
| Next-available-slot endpoint | ❌ MISSING | — | Required for ranking in Phase 2 |
| Session length per professional | ❌ MISSING | — | Schema has no `sessionMinutes` or `bufferMinutes` on `PhysioProfile` |
| Days-off (single day exceptions) | ❌ MISSING | — | No `DayOff` model |
| Accepting patients flag | ❌ MISSING | — | No `acceptingPatients` field on `PhysioProfile` |
| `/pro/availability` UI | ❌ MISSING | — | Route does not exist in `apps/web/src/app/pro/` |
| `policy.ts` with `SLOT_HOLD_MINUTES` | ❌ MISSING | — | No `packages/shared/src/policy.ts`; constants scattered |
| Concurrency test (race for one slot) | ❌ MISSING | — | No such test in `booking.service.spec.ts` |

---

## Phase 2 — Sign-up, safety check, choosing a physiotherapist

| Step | Status | Files | Notes |
|------|--------|-------|-------|
| Sign-up (name, email, password) | ✅ EXISTS | `apps/web/src/app/auth/signup/page.tsx` | Terms checkbox missing from this branch |
| Email verification lock (booking) | ✅ EXISTS | `apps/api/src/auth/` + `BookingService` checks `emailVerified` indirectly via `requireSession` |  |
| "Who is it for" (dependent selection) | ⚠️ PARTIAL | `packages/db/prisma/schema.prisma` → `Dependent` model exists | No intake UI for selecting dependent |
| Intake form (complaint, region, onset, pain) | ✅ EXISTS | `apps/web/src/app/app/intake/[step]/` | Multi-step wizard present |
| Red-flag questions | ✅ EXISTS | `apps/api/src/triage/rules.ts` | 8 RED rules, versioned, clinician notes |
| Triage engine (RED/AMBER/GREEN) | ✅ EXISTS | `apps/api/src/triage/triage.engine.ts` | `RULES_VERSION = "2026-10-01"` |
| RED blocks booking | ✅ EXISTS | `apps/api/src/booking/booking.service.ts` line ~90 | Throws `TRIAGE_RED` |
| AMBER allows with caution flag | ⚠️ PARTIAL | API enforces; **UI caution display not verified** | — |
| Ranked physiotherapist list | ❌ MISSING | — | No ranking function; `/app/physios/` route doesn't exist |
| Filters (area, language, price, gender, day, type) | ❌ MISSING | — | — |
| "Match me quickly" button | ❌ MISSING | — | — |
| Waitlist for chosen physio with no slot | ❌ MISSING | — | — |
| Each row: photo, name, discipline, language, price, rating, next slot | ❌ MISSING | — | — |
| Speech/prosthetics exception routing | ❌ MISSING | — | — |
| Public profile page | ⚠️ PARTIAL | `apps/web/src/app/professionals/[id]/page.tsx` | On `main` branch; not on this branch's current state |

---

## Phase 3 — Booking and payment

| Step | Status | Files | Notes |
|------|--------|-------|-------|
| Patient picks slot + visit type | ✅ EXISTS | `apps/web/src/app/app/book/[physioId]/page.tsx` | On main; this branch has earlier version |
| Price + cancellation shown before pay | ⚠️ PARTIAL | Price shown; cancellation rules not shown | — |
| Paystack checkout (test mode) | ✅ EXISTS | `apps/api/src/payments/payments.service.ts` | `PaymentProvider` abstraction |
| Webhook verify (sig check, idempotent) | ✅ EXISTS | `apps/api/src/payments/paystack-webhook.controller.ts` | — |
| Server-side verify call | ✅ EXISTS | `PaymentsService.verifyCharge` | — |
| Payment success → confirm in one transaction | ✅ EXISTS | `BookingService.confirmAfterPayment` | Writes CHARGE + HOLD ledger entries |
| Slot hold / expired hold releases booking | ❌ MISSING | — | No hold model; booking immediately goes to `PENDING_PAYMENT` |
| Booking confirmation email + ICS | ⚠️ PARTIAL | `NotificationsService.sendAppointmentConfirmed` exists | No ICS calendar attachment |
| 24h and 1h reminders via BullMQ | ⚠️ PARTIAL | `apps/api/src/reminders/` exists | Need to verify wiring |
| Cancel: patient early → full refund | ❌ MISSING | — | No cancel endpoint in `BookingService` |
| Cancel: patient late → 0% refund | ❌ MISSING | — | — |
| Cancel: professional no-show → full refund + rebook | ❌ MISSING | — | — |
| Patient no-show → no refund | ❌ MISSING | — | — |
| Technical failure → rebook free or refund | ❌ MISSING | — | — |
| Dispute within 24h → money held | ❌ MISSING | — | — |
| Release: 24h after note signed, no dispute | ⚠️ PARTIAL | `PaymentsService.releaseToPhysio` exists | Not triggered by note sign-off; triggered by `session.completed` event (immediately) |
| PLATFORM_FEE + PHYSIO_PAYOUT ledger entries | ✅ EXISTS | `PaymentsService.releaseToPhysio` | — |
| Weekly payout batch / admin marks paid | ❌ MISSING | — | No batch job, no admin payout list |
| Earnings page for professionals | ❌ MISSING | — | — |
| Referral sessions paid same way | ✅ EXISTS | Referral model links to Appointment which has Payment | Architecture correct; not specifically tested |

---

## Phase 4 — Consultation room

| Step | Status | Files | Notes |
|------|--------|-------|-------|
| Join button (JOIN_WINDOW_MINUTES before start) | ✅ EXISTS | `SessionsService.join` enforces 15-min window | — |
| Patient device check before entering | ❌ MISSING | — | No device-check screen |
| Three modes (video, live chat, in person) | ⚠️ PARTIAL | Schema: `SessionMode` has `VIDEO` and `HOME` only; no `CHAT` | Live chat as an equal session mode is missing |
| Daily room + short-lived tokens | ✅ EXISTS | `VideoService`, `packages/video/` | `DAILY_DOMAIN` env required |
| Fake/dev video provider for E2E | ✅ EXISTS | `apps/api/src/__mocks__/` | In-house fake provider |
| Professional layout (3 panes: summary, video, notes/exercises) | ⚠️ PARTIAL | `apps/web/src/app/pro/session/[id]/page.tsx` | Basic Daily embed + notes textarea; no 3-pane layout matching `ConsultRoom.dc.html` |
| Patient layout (phone, full-screen, chat drawer) | ⚠️ PARTIAL | `apps/web/src/app/app/session/[id]/page.tsx` | Basic Daily embed; no chat drawer, no exercise card |
| Audio-only switch without leaving room | ❌ MISSING | — | — |
| Screen share | ❌ MISSING | — | — |
| Failure fallback to chat after `CALL_FAILURE_FALLBACK_MINUTES` | ❌ MISSING | — | — |
| PRO_LATE_CANCEL: patient cancel with full refund if pro > 15 min late | ❌ MISSING | — | — |
| End session → opens note step | ⚠️ PARTIAL | Pro session redirects to `/pro/session/${id}/note` | Note route may not exist yet |
| Note screen | ⚠️ PARTIAL | `SessionNotesService.upsert` exists | No sign-off lock; no `/pro/session/[id]/note` UI verified |

---

## Phase 5 — Exercise library and home programme

| Step | Status | Files | Notes |
|------|--------|-------|-------|
| Exercise model + Program model | ✅ EXISTS | Schema: `Exercise`, `Program`, `ProgramItem`, `ExerciseLog` | — |
| Library search (body area, condition, goal, equipment) | ⚠️ PARTIAL | `apps/api/src/programs/programs.service.ts` | Full-text search not implemented |
| `clinicalReview` gate (only reviewed items to real patients) | ⚠️ PARTIAL | Field exists on `Exercise`; not enforced in programs API | — |
| In-session exercise add + live push to patient | ❌ MISSING | — | No live push mechanism (WebSocket/SSE needed) |
| Patient "Today" list (video, dose, Done, feel rating) | ⚠️ PARTIAL | `apps/web/src/app/app/plan/page.tsx` exists | Feel rating (easy/okay/painful) not implemented |
| Pain threshold alert to professional | ❌ MISSING | — | — |
| Progress: streak, adherence, pain chart | ❌ MISSING | — | — |
| Inactivity nudge job (`INACTIVITY_NUDGE_DAYS`) | ❌ MISSING | — | — |
| Plan versioning (new version on change) | ❌ MISSING | — | Schema has no version field on `Program` |
| Admin exercise library browser + review flag | ⚠️ PARTIAL | `apps/web/src/app/(admin)/admin/library/page.tsx` exists | — |

---

## Phase 6 — Documentation

| Step | Status | Files | Notes |
|------|--------|-------|-------|
| SOAP note model | ✅ EXISTS | Schema: `SessionNote` (subjective, objective, assessment, plan, outcomeMeasures) | — |
| Note upsert + audit log | ✅ EXISTS | `SessionNotesService.upsert` | — |
| Note get + audit log | ✅ EXISTS | `SessionNotesService.get` | — |
| Autosave (debounced, resilient) | ❌ MISSING | — | No autosave in pro session UI |
| Sign-off lock | ❌ MISSING | — | No `signedAt` / `lockedAt` field on `SessionNote` |
| Addenda (post-sign-off changes dated) | ❌ MISSING | — | Schema has no `NoteAddendum` model |
| Discipline templates (SOAP prefilled from intake) | ❌ MISSING | — | Note form not prefilled |
| Outcome measures as numbers (chartable) | ⚠️ PARTIAL | `outcomeMeasures Json` field exists | No UI to enter or chart them |
| Release timer triggered by sign-off | ❌ MISSING | — | Currently triggered immediately on `session.completed` event |
| Patient summary (plain language, pro edits, then link by email) | ❌ MISSING | — | — |

---

## Phase 7 — Referrals

| Step | Status | Files | Notes |
|------|--------|-------|-------|
| Referral model + state machine | ✅ EXISTS | Schema + `apps/api/src/referrals/referrals.service.ts` | Full state machine |
| Refer tab in room | ❌ MISSING | — | Not in session UI |
| Patient consent UI (shows what is shared) | ❌ MISSING | — | Schema has `patientConsented` field; no UI |
| Receiver email + inbox item | ⚠️ PARTIAL | `NotificationsService` exists | Referral-specific email not verified |
| Receiver accepts/declines | ✅ EXISTS | `referrals.service.ts` | — |
| Decline → returns to sender | ✅ EXISTS | State machine | — |
| Stall job (`REFERRAL_STALL_DAYS = 3`) | ❌ MISSING | — | No BullMQ stall job |
| Patient booking screen for receiver | ❌ MISSING | — | — |
| Receiver note + plan + summary back | ❌ MISSING | — | — |
| Patient "My care team" view | ❌ MISSING | — | — |

---

## Phase 8 — After the consultation

| Step | Status | Files | Notes |
|------|--------|-------|-------|
| Thread + Message model | ✅ EXISTS | Schema | — |
| Messaging UI (patient ↔ professional) | ⚠️ PARTIAL | `apps/web/src/app/app/messages/` | Basic chat UI exists |
| "Not for emergencies" notice + reply SLA | ❌ MISSING | — | — |
| Red-flag word detection in messages | ❌ MISSING | — | — |
| Book follow-up before leaving room | ❌ MISSING | — | — |
| Inactivity nudge | ❌ MISSING | — | — |
| Reassessment prompt at set interval | ❌ MISSING | — | — |
| Discharge summary | ❌ MISSING | — | — |
| Discharge feedback / ratings | ❌ MISSING | — | Schema has `Review` model; no UI |
| Rebook same professional in one tap | ❌ MISSING | — | — |

---

## Phase 9 — E2E tests

| Step | Status | Files | Notes |
|------|--------|-------|-------|
| Playwright config | ❌ MISSING | — | No `playwright.config.ts` in repo |
| Full journey E2E | ❌ MISSING | — | — |

---

## Unit test counts (from `apps/api`)

> Tests run from `apps/api` using `npx jest --no-coverage`.
> Numbers filled in after test run; see background task output.

| File | Result | Tests |
|------|--------|-------|
| `auth.service.spec.ts` | ✅ PASS | — |
| `throttler-guards.spec.ts` | ✅ PASS | — |
| `booking.service.spec.ts` | ✅ PASS | — |
| `notifications.service.spec.ts` | ✅ PASS | — |
| `payment-provider.guard.spec.ts` | ✅ PASS | — |
| `payments.service.spec.ts` | ✅ PASS | — |
| `paystack-webhook.controller.spec.ts` | ✅ PASS | — |
| `physio.service.spec.ts` | ❌ FAIL | TS2339: `input.rate` — field renamed to `rateKobo` in schema but service not updated |
| `triage.engine.spec.ts` | ✅ PASS | — |
| **Total** | 8 passed / 1 failed | **74 tests** |

No E2E (Playwright) tests exist. All UI pages are **type-checked only** (not browser-verified in this audit run).

**Pre-existing failure:** `physio.service.ts:117` uses `input.rate` but the DTO/schema field is `rateKobo`. Needs a one-line fix (bug #7 below).

---

## Missing schema fields / models required by the prompt

1. `PhysioProfile`: add `sessionMinutes Int @default(45)`, `bufferMinutes Int @default(15)`, `acceptingPatients Boolean @default(true)`
2. New model: `SlotHold` — `physioId`, `startsAt`, `endsAt`, `patientId`, `expiresAt`, `appointmentId?`
3. New model: `DayOff` — `physioId`, `date`, `reason?`
4. `SessionNote`: add `signedAt DateTime?`, `signedBy String?`
5. New model: `NoteAddendum` — `noteId`, `body`, `addedBy`, `addedAt`
6. `Appointment`: add `cancelledAt DateTime?`, `cancelReason String?`, `disputeAt DateTime?`
7. `Program`: add `version Int @default(1)`
8. New model: `PatientSummary` — `appointmentId`, `body`, `approvedAt?`, `approvedBy?`

---

## Missing `packages/shared/src/policy.ts`

All tunable constants are currently scattered (e.g. `JOIN_WINDOW_MIN = 15` in `sessions.service.ts`, `PLATFORM_FEE_BPS` in `payments.service.ts`). Need to centralise in one file.

---

## Known bugs visible from reading

1. `SlotService.listForPhysio` hardcodes `SLOT_DURATION_MIN = 45` — ignores the professional's `sessionMinutes` preference.
2. `PaymentsService.releaseToPhysio` is triggered by `session.completed` event immediately on session end — should wait `RELEASE_DELAY_HOURS` after note sign-off.
3. Session notes have no `signedAt` field — there is nothing preventing editing a note after the fact.
4. `SessionsService.join` hardcodes `JOIN_WINDOW_MIN = 15` — should read from `policy.ts`.
5. The `VideoService.roomUrl` throws if `DAILY_DOMAIN` is not set rather than falling back to the in-house provider URL.
6. No slot concurrency protection: two concurrent requests calling `isSlotBookable` before either creates the appointment would both see the slot as free.
7. `physio.service.ts:117` uses `input.rate` — field is `rateKobo` in the Prisma schema; causes `physio.service.spec.ts` to fail to compile.

---

## Things only Victor can do

1. **Confirm production Paystack keys** — set `PAYSTACK_SECRET_KEY` (live). Currently TEST mode only per prompt.
2. **Configure Daily.co domain** — set `DAILY_DOMAIN` and `DAILY_API_KEY` env vars.
3. **Configure Resend** — set `RESEND_API_KEY` and `MAIL_FROM` for transactional email.
4. **Confirm real licensing bodies** — `LicensingBody` table is seeded with placeholders.
5. **Review and mark exercises** — `clinicalReview = true` requires a clinician; seed content is unreviewed.
6. **Redis URL for BullMQ** — set `REDIS_URL` for job queues.
7. **Approve merge to main** — per prompt, do not merge.
